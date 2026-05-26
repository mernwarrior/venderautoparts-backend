import Transaction from "../models/transaction.model.js";
import { getCache, setCache } from "../utils/cacheService.js";
import { RAFFAL_STATUS, HTTP_STATUS, RESPONSE_STATUS, ROLE_TYPE } from "../utils/constant.js";
import mongoose from "mongoose";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { errorResponse } from "../utils/index.js";




export const getAllTransaction = async (userId, role, payload) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      date,
      startDate,
      endDate,
    } = payload;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // ─── Match Criteria ────────────────────────────────────────────────────

    const matchCriteria = {};

    // Admin = sare transactions, User = sirf apne
    if (role !== ROLE_TYPE.ADMIN) {
      matchCriteria.userId = new mongoose.Types.ObjectId(userId);
    }

    // Status filter
    if (status) {
      matchCriteria.status = status;
    }

    // Payment method filter
    if (paymentMethod) {
      matchCriteria.paymentMethod = paymentMethod;
    }

    // ─── Date Filter ───────────────────────────────────────────────────────

    if (date) {
      const now = new Date();
      let start;
      let end = now;

      switch (date) {
        case "today":
          start = new Date();
          start.setHours(0, 0, 0, 0);
          end = new Date();
          end.setHours(23, 59, 59, 999);
          break;

        case "1week":
          start = new Date();
          start.setDate(start.getDate() - 7);
          break;

        case "1month":
          start = new Date();
          start.setMonth(start.getMonth() - 1);
          break;

        case "2month":
          start = new Date();
          start.setMonth(start.getMonth() - 2);
          break;

        case "3month":
          start = new Date();
          start.setMonth(start.getMonth() - 3);
          break;

        case "custom":
          if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
          }
          break;
      }

      if (start) {
        matchCriteria.createdAt = { $gte: start, $lte: end };
      }
    }

    // ─── Cache Key ─────────────────────────────────────────────────────────

    const cacheKey = `transactions:${role}:${userId}:${pageNumber}:${limitNumber}:${status || "all"}:${paymentMethod || "all"}:${date || "all"}:${startDate || ""}:${endDate || ""}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // ─── Aggregation Pipeline ──────────────────────────────────────────────

    const pipeline = [
      { $match: matchCriteria },

      // Join Order details
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
          pipeline: [
            {
              $project: {
                orderId: 1,
                ticketQuantity: 1,
                // raffleId: 1,
                // promoCode: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$order",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Join Raffle details
    //   {
    //     $lookup: {
    //       from: "raffles",
    //       localField: "order.raffleId",
    //       foreignField: "_id",
    //       as: "raffle",
    //       pipeline: [
    //         {
    //           $project: {
    //             title: 1,
    //             slug: 1,
    //             featureImage: 1,
    //             ticketPrice: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$raffle",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },

      // Join User — only meaningful for admin view
      ...(role === ROLE_TYPE.ADMIN
        ? [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [
                  {
                    $project: {
                      firstName: 1,
                      lastName: 1,
                      email: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]
        : []),

      { $sort: { createdAt: -1 } },

      // ─── Facet ──────────────────────────────────────────────────────────
      {
        $facet: {
          // Paginated data
          data: [
            { $skip: skip },
            { $limit: limitNumber },
            {
              $project: {
                _id: 1,
                amount: 1,
                currency: 1,
                paymentMethod: 1,
                status: 1,
                gatewayTransactionId: 1,
                createdAt: 1,
                order: 1,
                raffle: 1,
                ...(role === "admin" ? { user: 1 } : {}),
              },
            },
          ],

          // Total count
          totalCount: [{ $count: "count" }],

        
        },
      },
    ];

    const result = await Transaction.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;


    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Transactions"),
      httpStatus: HTTP_STATUS.OK,
      data,
      totalCount,
      currentCount: data.length,   

    };

    await setCache(cacheKey, response, 60);

    return response;

  } catch (error) {
    console.error("getAllTransaction error:", error);
    return errorResponse(
      error.message || RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      HTTP_STATUS.SERVER_ERROR
    );
  }
};