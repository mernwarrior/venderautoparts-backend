import Ticket from "../models/ticket.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Raffal from "../models/raffle.model.js";
import { HTTP_STATUS, RESPONSE_STATUS, ROLE_TYPE } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { getCache, setCache } from "../utils/cacheService.js";
import mongoose from "mongoose";

const errorResponse = (message, httpStatus = HTTP_STATUS.BAD_REQUEST) => ({
    status: RESPONSE_STATUS.ERROR,
    message,
    httpStatus,
});

export const getAllTickets = async (userId, payload) => {
    try {
        
        const {
            page = 1,
            limit = 10,
            keyword,
            status
        } = payload; 

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const matchCriteria = {};

        if (userId) {
            matchCriteria.userId = new mongoose.Types.ObjectId(userId);
        }
        if (status) {
            if (status === "winner") {
                matchCriteria.isWinner = true;
            } else if (status === "pending" || status === "drawn") {
                matchCriteria.status = status;
                matchCriteria.isWinner = false;
            } else {
                matchCriteria.status = status;
            }
        }
        

        if (keyword) {
            matchCriteria.$or = [
                { ticketNumber: { $regex: keyword, $options: "i" } },
            ];
        }

                const cacheKey = [
            "tickets",
            pageNumber,
            limitNumber,
            userId   || "noUser",
            status   || "noStatus",
            keyword  || "noKeyword",
        ].join(":");
        const cachedData = await getCache(cacheKey);
        if (cachedData) return cachedData;


        const pipeline = [
            { $match: matchCriteria },
            { $sort: { createdAt: -1 } },

            {
                $lookup: {
                    from: "raffles",
                    localField: "raffleId",
                    foreignField: "_id",
                    as: "raffle",
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                // description: 1,
                                featureMedia: 1,
                                raffleStartDate: 1,
                                raffleEndDate: 1,
                                drawStatus: 1,
                                kycDeadline:1
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$raffle",
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user", // ✅ Bug 4: was "users" but unwind used "$user"
                    pipeline: [
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                userName: 1,
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

            // ✅ Bug 5: $facet se pehle $skip/$limit nahi hona chahiye
            // $facet ke andar hi skip/limit hona chahiye (jo sahi hai)
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limitNumber },
                    ],
                    totalCount: [
                        { $count: "count" },
                    ],
                },
            },
        ];

        const result = await Ticket.aggregate(pipeline);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount[0]?.count || 0;

        const response = {
            status: RESPONSE_STATUS.SUCCESS,
            message: RESPONSE_MESSAGES.RETRIEVE("Tickets"),
            data,
            totalCount,
            currentCount: data.length,
            httpStatus: HTTP_STATUS.OK,
        };

        await setCache(cacheKey, response, 120);

        return response;

    } catch (error) {
        console.error("getAllTickets error:", error);
        return errorResponse(
            error.message || "Something went wrong",
            HTTP_STATUS.SERVER_ERROR
        );
    }
};
export const getAllTicketsByAdmin = async (payload) => {
    try {


        const {
            page = 1,
            limit = 10,
            keyword,
            userId
        } = payload; 

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const matchCriteria = {};

        if (userId) {
            matchCriteria.userId = new mongoose.Types.ObjectId(userId);
        }
        if (keyword) {
            matchCriteria.$or = [
                { ticketNumber: { $regex: keyword, $options: "i" } },
            ];
        }

        // console.log('match', matchCriteria)

        const cacheKey = `ticketsAll:${pageNumber}:${limitNumber}:${userId || "all"}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) return cachedData;

        const pipeline = [
            { $match: matchCriteria },
            { $sort: { createdAt: -1 } },

            {
                $lookup: {
                    from: "raffles",
                    localField: "raffleId",
                    foreignField: "_id",
                    as: "raffle",
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                // description: 1,
                                featureMedia: 1,
                                raffleStartDate: 1,
                                raffleEndDate: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$raffle",
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user", // ✅ Bug 4: was "users" but unwind used "$user"
                    pipeline: [
                        {
                            $project: {
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                userName: 1,
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

            // ✅ Bug 5: $facet se pehle $skip/$limit nahi hona chahiye
            // $facet ke andar hi skip/limit hona chahiye (jo sahi hai)
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limitNumber },
                    ],
                    totalCount: [
                        { $count: "count" },
                    ],
                },
            },
        ];

        const result = await Ticket.aggregate(pipeline);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount[0]?.count || 0;

        const response = {
            status: RESPONSE_STATUS.SUCCESS,
            message: RESPONSE_MESSAGES.RETRIEVE("Tickets"),
            data,
            totalCount,
            currentCount: data.length,
            httpStatus: HTTP_STATUS.OK,
        };

        await setCache(cacheKey, response, 120);

        return response;

    } catch (error) {
        console.error("getAllTickets error:", error);
        return errorResponse(
            error.message || "Something went wrong",
            HTTP_STATUS.SERVER_ERROR
        );
    }
};

export const getTicketStats = async (userId, payload) => {
  try {
    const { page = 1, limit = 10, status } = payload;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const cacheKey = `raffle:stats:${userId}:${pageNumber}:${limitNumber}:${status || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    const pipeline = [
      // Step 1: Join raffle
      {
        $lookup: {
          from: "raffles",
          localField: "raffleId",
          foreignField: "_id",
          as: "raffle",
        },
      },
      { $unwind: "$raffle" },

      // Step 2: Filter only creator's raffles
      {
        $match: {
          "raffle.userId": userId,
          ...(status && { status }),
        },
      },

      // Step 3: Group by raffle (IMPORTANT 🔥)
      {
        $group: {
          _id: "$raffle._id",

          title: { $first: "$raffle.title" },
          ticketPrice: { $first: "$raffle.ticketPrice" },
          totalTickets: { $first: "$raffle.totalTickets" },
          soldTickets: { $first: "$raffle.soldTickets" },
          raffleEndDate: { $first: "$raffle.raffleEndDate" },
          raffleStartDate: { $first: "$raffle.raffleStartDate" },
          status: { $first: "$raffle.status" },

          totalRevenue: {
            $sum: "$raffle.ticketPrice",
          },

          totalTicketsSold: { $sum: 1 },

          uniqueBuyers: {
            $addToSet: "$userId", // buyers list
          },
        },
      },

      // Step 4: Add computed fields
      {
        $addFields: {
          buyersCount: { $size: "$uniqueBuyers" },

          soldPercentage: {
            $cond: {
              if: { $gt: ["$totalTickets", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$soldTickets", "$totalTickets"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },

          remainingTickets: {
            $subtract: ["$totalTickets", "$soldTickets"],
          },

          isRaffleEnded: {
            $gt: [new Date(), "$raffleEndDate"],
          },
        },
      },

      // Step 5: Clean response
      {
        $project: {
          uniqueBuyers: 0, // remove internal array
        },
      },

      { $sort: { raffleStartDate: -1 } },

      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNumber },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Ticket.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffle Stats"),
      httpStatus: HTTP_STATUS.OK,
      data,
      totalCount,
      currentCount: data.length,
    };

    await setCache(cacheKey, response, 60);

    return response;

  } catch (error) {
    console.error("getTicketStats error:", error);
    return errorResponse(
      error.message || RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      HTTP_STATUS.SERVER_ERROR
    );
  }
};

//old
// export const getTicketStats = async (userId, payload) => {
//   try {
//     const { page = 1, limit = 10, status } = payload;

//     const pageNumber = parseInt(page);
//     const limitNumber = parseInt(limit);
//     const skip = (pageNumber - 1) * limitNumber;

//     const matchCriteria = {
//       userId: userId
//     };

//     if (status) {
//       matchCriteria.status = status;
//     }

//     const cacheKey = `ticket:stats:${userId}:${pageNumber}:${limitNumber}:${status || "all"}`;
//     const cachedData = await getCache(cacheKey);
//     if (cachedData) return cachedData;

//     const pipeline = [
//       { $match: matchCriteria },

//       // Join raffle details
//       {
//         $lookup: {
//           from: "raffles",
//           localField: "raffleId",
//           foreignField: "_id",
//           as: "raffle",
//           pipeline: [
//             {
//               $project: {
//                 title: 1,
//                 // slug: 1,
//                 // featureImage: 1,
//                 ticketPrice: 1,
//                 raffleEndDate: 1,
//                 raffleStartDate: 1,
//                 totalTickets: 1,
//                 soldTickets: 1,
//                 status: 1,
//                 deliveryMethod: 1,
//               },
//             },
//           ],
//         },
//       },
//       {
//         $unwind: {
//           path: "$raffle",
//           preserveNullAndEmptyArrays: true,
//         },
//       },



//       // Computed fields
//       {
//         $addFields: {
//           raffleSoldPercentage: {
//             $cond: {
//               if: { $gt: ["$raffle.totalTickets", 0] },
//               then: {
//                 $round: [
//                   {
//                     $multiply: [
//                       { $divide: ["$raffle.soldTickets", "$raffle.totalTickets"] },
//                       100,
//                     ],
//                   },
//                   2,
//                 ],
//               },
//               else: 0,
//             },
//           },
//           raffleRemainingTickets: {
//             $subtract: ["$raffle.totalTickets", "$raffle.soldTickets"],
//           },
//           isRaffleEnded: {
//             $gt: [new Date(), "$raffle.raffleEndDate"],
//           },
//           isWinningTicket: "$isWinner",
//         },
//       },

//       { $sort: { createdAt: -1 } },

//       {
//         $facet: {
//           data: [
//             { $skip: skip },
//             { $limit: limitNumber },
//             {
//               $project: {
//                 ticketNumber: 1,
//                 status: 1,
//                 isWinner: 1,
//                 isWinningTicket: 1,
//                 winnerDeclaredAt: 1,
//                 createdAt: 1,
//                 raffle: 1,
//                 order: 1,
//                 raffleSoldPercentage: 1,
//                 raffleRemainingTickets: 1,
//                 isRaffleEnded: 1,
//               },
//             },
//           ],

//           // Total count for pagination
//           totalCount: [{ $count: "count" }],
//         },
//       },
//     ];
//     const result = await Ticket.aggregate(pipeline);

//     const data = result[0]?.data || [];
//     const totalCount = result[0]?.totalCount[0]?.count || 0;


//     const response = {
//       status: RESPONSE_STATUS.SUCCESS,
//       message: RESPONSE_MESSAGES.RETRIEVE("Ticket Stats"),
//       httpStatus: HTTP_STATUS.OK,
//       data,   
//             totalCount,
//       currentCount: data.length,                          // paginated ticket list

//     };

//     // Cache for 60s — shorter TTL since tickets change frequently
//     await setCache(cacheKey, response, 60);

//     return response;

//   } catch (error) {
//     console.error("getTicketStats error:", error);
//     return errorResponse(
//       error.message || RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
//       HTTP_STATUS.SERVER_ERROR
//     );
//   }
// };