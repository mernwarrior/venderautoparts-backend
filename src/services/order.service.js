import mongoose from "mongoose";
import Raffle from "../models/raffle.model.js";
import Ticket from "../models/ticket.model.js";
import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js"
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js"
import RaffleEarning from "../models/raffleEarning.model.js"
import Audit from "../models/audit.model.js"
import { sendEmail } from "../utils/emailService.js";
import { RAFFAL_STATUS, HTTP_STATUS, RESPONSE_STATUS, TRANSACTION_TYPE, DEFAULT_SETTINGS } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { errorResponse, generateOrderNumber, generateTicketNumber } from "../utils/index.js";
import { getCache, setCache } from "../utils/cacheService.js";
import { ticketPurchasedTemplate } from "../utils/emailTemplates/ticketPurchasedTemplate.js";
import { paypal } from "../config/paypal.js";



export const buyTickets = async (payload, userId, req) => {
  const { raffleId, ticketQuantity, paymentMethod, promoCode } = payload;

  // ─── Pre-transaction validations ──────────────────────────────────────────

  const raffle    = await Raffle.findById(raffleId);
  const userData  = await User.findById(userId);

  if (!raffle) {
    return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Raffle"), HTTP_STATUS.NOT_FOUND);
  }

  if (raffle.userId.toString() === userId.toString()) {
    return errorResponse("You cannot purchase tickets for your own raffle", HTTP_STATUS.FORBIDDEN);
  }

  if (raffle.status !== RAFFAL_STATUS.APPROVE) {
    return errorResponse("Raffle is not approved for ticket sales");
  }

  const now = new Date();

  if (now < raffle.raffleStartDate) {
    return errorResponse("Raffle has not started yet");
  }

  if (now > raffle.raffleEndDate) {
    return errorResponse("Raffle has already ended");
  }

  const remainingTickets = raffle.totalTickets - raffle.soldTickets;
  if (remainingTickets < ticketQuantity) {
    return errorResponse("Not enough tickets available");
  }

  const userTickets = await Ticket.countDocuments({ raffleId, userId });
  if (userTickets + ticketQuantity > raffle.maxTicketsPerUser) {
    return errorResponse(
      `Max tickets per user is ${raffle.maxTicketsPerUser}. You already have ${userTickets}.`
    );
  }

  // ─── Fee calculation (uses DEFAULT_SETTINGS.PLATFORM_FEES) ────────────────

  const amount      = raffle.ticketPrice * ticketQuantity;
  const platformFee = (amount * DEFAULT_SETTINGS.PLATFORM_FEES) / 100;  // 5%
  const netAmount   = amount - platformFee;

  // ─── Transaction ──────────────────────────────────────────────────────────

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderId = await generateOrderNumber(session);

    // 1. Create Order
    const order = await Order.create(
      [{
        orderId,
        userId,
        raffleId,
        ticketQuantity,
        amount,
        promoCode,
        paymentMethod,
        paymentStatus: "pending",
      }],
      { session }
    );

    const orderDoc = order[0];

    // 2. Generate ticket numbers in parallel
    const ticketNumbers = await Promise.all(
      Array.from({ length: ticketQuantity }, () => generateTicketNumber(session))
    );

    // 3. Create Tickets
    const ticketsData = ticketNumbers.map((ticketNumber) => ({
      ticketNumber,
      raffleId,
      userId,
      orderId: orderDoc._id,
    }));

    const createdTickets = await Ticket.insertMany(ticketsData, { session });

    // 4. Attach ticket IDs to order
    orderDoc.ticketIds = createdTickets.map((t) => t._id);
    await orderDoc.save({ session });

    // 5. Increment soldTickets on Raffle
    await Raffle.findByIdAndUpdate(
      raffle._id,
      { $inc: { soldTickets: ticketQuantity } },
      { session }
    );


    await RaffleEarning.findOneAndUpdate(
      { raffleId },
      {
        $setOnInsert: {
          userId: raffle.userId,
          status: "locked",
        },
        $inc: {
          grossAmount: amount,
          platformFee: platformFee,
          netAmount:   netAmount,
        },
      },
      { upsert: true, session, returnDocument: 'after' }
    );

    // 7. Transaction record
    await Transaction.create(
      [{
        orderId: orderDoc._id,
        userId,
        amount,
        currency: "USD",
        type: TRANSACTION_TYPE.TICKET_PURCHASE,
        paymentMethod,
        gatewayTransactionId: null,
        status: "pending",
        response: null,
      }],
      { session }
    );

    // 8. Notification to buyer
    await Notification.create(
      [{
        userId,
        message: `You have successfully purchased ${ticketQuantity} ticket(s) for "${raffle.title}".`,
      }],
      { session }
    );

    // 9. Audit log
    await Audit.create(
      [{
        userId,
        action: "BUY_TICKETS",
        changes: {
          raffleId:       raffle._id,
          orderId:        orderDoc._id,
          ticketIds:      createdTickets.map((t) => t._id),
          ticketQuantity,
          totalAmount:    amount,
          platformFee,
          netAmount,
        },
        ipAddress:  req.ip,
        userAgent:  req.headers["user-agent"],
        message: `${ticketQuantity} ticket(s) purchased for raffle "${raffle.title}"`,
      }],
      { session }
    );

    await session.commitTransaction();

    // 10. Send confirmation email (outside transaction — non-critical)
    const username = `${userData.firstName} ${userData.lastName}`;
    sendEmail(
      userData.email,
      `Ticket Confirmation — ${raffle.title}`,
      ticketPurchasedTemplate(
        username,
        createdTickets.map((t) => ({ ticketNumber: t.ticketNumber })),
        {
          title:         raffle.title,
          ticketPrice:   raffle.ticketPrice,
          raffleEndDate: raffle.raffleEndDate,
        },
        {
          orderId:        orderDoc.orderId,
          ticketQuantity,
          amount,
        }
      )
    );

    return {
      status:     RESPONSE_STATUS.SUCCESS,
      message:    "Tickets purchased successfully",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    await session.abortTransaction();
    console.error("buyTickets error:", error);
    return errorResponse(
      RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      HTTP_STATUS.SERVER_ERROR
    );
  } finally {
    session.endSession();
  }
};

// export const buyTickets = async (payload, userId, req) => {
//   const { raffleId, ticketQuantity, paymentMethod, promoCode } = payload;

//   // ─── Tumhari existing validations same rahegi ──────────────────
//   const raffle   = await Raffle.findById(raffleId);
//   const userData = await User.findById(userId);

//   if (!raffle) return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Raffle"), HTTP_STATUS.NOT_FOUND);
//   if (raffle.userId.toString() === userId.toString()) return errorResponse("You cannot purchase tickets for your own raffle", HTTP_STATUS.FORBIDDEN);
//   if (raffle.status !== RAFFAL_STATUS.APPROVE) return errorResponse("Raffle is not approved for ticket sales");

//   const now = new Date();
//   if (now < raffle.raffleStartDate) return errorResponse("Raffle has not started yet");
//   if (now > raffle.raffleEndDate)   return errorResponse("Raffle has already ended");

//   const remainingTickets = raffle.totalTickets - raffle.soldTickets;
//   if (remainingTickets < ticketQuantity) return errorResponse("Not enough tickets available");

//   const userTickets = await Ticket.countDocuments({ raffleId, userId });
//   if (userTickets + ticketQuantity > raffle.maxTicketsPerUser) {
//     return errorResponse(`Max tickets per user is ${raffle.maxTicketsPerUser}. You already have ${userTickets}.`);
//   }

//   // ─── Fee calculation ───────────────────────────────────────────
//   const amount      = raffle.ticketPrice * ticketQuantity;
//   const platformFee = (amount * DEFAULT_SETTINGS.PLATFORM_FEES) / 100;
//   const netAmount   = amount - platformFee;

//   // ─── PayPal Order Create ───────────────────────────────────────
//   if (paymentMethod === "paypal") {
//     const paypalOrder = await paypal.createOrder({
//       body: {
//         intent: "CAPTURE",
//         purchaseUnits: [
//           {
//             amount: {
//               currencyCode: "USD",
//               value: amount.toFixed(2),
//             },
//             description: `${ticketQuantity} ticket(s) for "${raffle.title}"`,
//           },
//         ],
//       },
//     });

//     // Pending order DB mein save karo (capture ke liye zaruri)
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {
//       const orderId = await generateOrderNumber(session);

//       const order = await Order.create(
//         [{
//           orderId,
//           userId,
//           raffleId,
//           ticketQuantity,
//           amount,
//           promoCode,
//           paymentMethod,
//           paymentStatus: "pending",
//           gatewayOrderId: paypalOrder.result.id,  // PayPal order ID save karo
//         }],
//         { session }
//       );

//       await session.commitTransaction();

//       // Frontend ko PayPal order ID do — woh PayPal pe redirect karega
//       return {
//         status:     RESPONSE_STATUS.SUCCESS,
//         message:    "PayPal order created",
//         httpStatus: HTTP_STATUS.OK,
//         data: {
//           paypalOrderId: paypalOrder.result.id,
//           orderId:       order[0]._id,
//           amount,
//         },
//       };
//     } catch (error) {
//       await session.abortTransaction();
//       return errorResponse(RESPONSE_MESSAGES.SOMETHING_WENT_WRONG, HTTP_STATUS.SERVER_ERROR);
//     } finally {
//       session.endSession();
//     }
//   }
// };

export const capturePaypalPayment = async (paypalOrderId, userId, req) => {
  // 1. PayPal pe capture karo
  const capture = await paypal.captureOrder({
    id: paypalOrderId,
  });

  if (capture.result.status !== "COMPLETED") {
    return errorResponse("Payment not completed", HTTP_STATUS.BAD_REQUEST);
  }

  // 2. DB se pending order nikalo
  const orderDoc = await Order.findOne({ gatewayOrderId: paypalOrderId, userId });
  if (!orderDoc) return errorResponse("Order not found", HTTP_STATUS.NOT_FOUND);

  const raffle   = await Raffle.findById(orderDoc.raffleId);
  const userData = await User.findById(userId);

  const amount      = orderDoc.amount;
  const platformFee = (amount * DEFAULT_SETTINGS.PLATFORM_FEES) / 100;
  const netAmount   = amount - platformFee;

  // 3. Tumhara existing transaction logic — tickets create karo
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Tickets generate karo
    const ticketNumbers = await Promise.all(
      Array.from({ length: orderDoc.ticketQuantity }, () => generateTicketNumber(session))
    );

    const ticketsData = ticketNumbers.map((ticketNumber) => ({
      ticketNumber,
      raffleId: orderDoc.raffleId,
      userId,
      orderId: orderDoc._id,
    }));

    const createdTickets = await Ticket.insertMany(ticketsData, { session });

    // Order update karo
    orderDoc.ticketIds     = createdTickets.map((t) => t._id);
    orderDoc.paymentStatus = "completed";
    await orderDoc.save({ session });

    // Raffle soldTickets update
    await Raffle.findByIdAndUpdate(raffle._id, { $inc: { soldTickets: orderDoc.ticketQuantity } }, { session });

    // RaffleEarning update
    await RaffleEarning.findOneAndUpdate(
      { raffleId: orderDoc.raffleId },
      {
        $setOnInsert: { userId: raffle.userId, status: "locked" },
        $inc: { grossAmount: amount, platformFee, netAmount },
      },
      { upsert: true, session, returnDocument: "after" }
    );

    // Transaction record
    await Transaction.create(
      [{
        orderId:              orderDoc._id,
        userId,
        amount,
        currency:             "USD",
        type:                 TRANSACTION_TYPE.TICKET_PURCHASE,
        paymentMethod:        "paypal",
        gatewayTransactionId: capture.result.id,
        status:               "completed",
        response:             capture.result,
      }],
      { session }
    );

    // Notifications + Audit (tumhara existing code)
    await Notification.create([{ userId, message: `You have successfully purchased ${orderDoc.ticketQuantity} ticket(s) for "${raffle.title}".` }], { session });
    await Audit.create([{
      userId,
      action:    "BUY_TICKETS",
      changes:   { raffleId: raffle._id, orderId: orderDoc._id, ticketIds: createdTickets.map((t) => t._id) },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      message:   `${orderDoc.ticketQuantity} ticket(s) purchased for raffle "${raffle.title}"`,
    }], { session });

    await session.commitTransaction();

    // Email (transaction ke bahar)
    const username = `${userData.firstName} ${userData.lastName}`;
    sendEmail(userData.email, `Ticket Confirmation — ${raffle.title}`,
      ticketPurchasedTemplate(username, createdTickets.map((t) => ({ ticketNumber: t.ticketNumber })),
        { title: raffle.title, ticketPrice: raffle.ticketPrice, raffleEndDate: raffle.raffleEndDate },
        { orderId: orderDoc.orderId, ticketQuantity: orderDoc.ticketQuantity, amount }
      )
    );

    return { status: RESPONSE_STATUS.SUCCESS, message: "Payment captured & tickets issued", httpStatus: HTTP_STATUS.OK };

  } catch (error) {
    await session.abortTransaction();
    return errorResponse(RESPONSE_MESSAGES.SOMETHING_WENT_WRONG, HTTP_STATUS.SERVER_ERROR);
  } finally {
    session.endSession();
  }
};


export const getAllOrders = async (payload) => {
    try {


        const {
            page = 1,
            limit = 10,
            keyword,
            paymentMethod
        } = payload; 

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const matchCriteria = {};

        if (paymentMethod) {
            matchCriteria.paymentMethod = paymentMethod;
        }
        // if (keyword) {
        //     matchCriteria.$or = [
        //         { ticketNumber: { $regex: keyword, $options: "i" } },
        //     ];
        // }

        // console.log('match', matchCriteria)

        const cacheKey = `ordersAll:${pageNumber}:${limitNumber}:${paymentMethod || "all"}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) return cachedData;

        const pipeline = [
            { $match: matchCriteria },
            { $sort: { createdAt: -1 } },

            // {
            //     $lookup: {
            //         from: "raffles",
            //         localField: "raffleId",
            //         foreignField: "_id",
            //         as: "raffle",
            //         pipeline: [
            //             {
            //                 $project: {
            //                     title: 1,
            //                     // description: 1,
            //                     featureMedia: 1,
            //                     raffleStartDate: 1,
            //                     raffleEndDate: 1,
            //                 },
            //             },
            //         ],
            //     },
            // },
            // {
            //     $unwind: {
            //         path: "$raffle",
            //         preserveNullAndEmptyArrays: true,
            //     },
            // },

            // {
            //     $lookup: {
            //         from: "users",
            //         localField: "userId",
            //         foreignField: "_id",
            //         as: "user", // ✅ Bug 4: was "users" but unwind used "$user"
            //         pipeline: [
            //             {
            //                 $project: {
            //                     firstName: 1,
            //                     lastName: 1,
            //                     email: 1,
            //                     userName: 1,
            //                     avatar: 1,
            //                 },
            //             },
            //         ],
            //     },
            // },
            // {
            //     $unwind: {
            //         path: "$user",
            //         preserveNullAndEmptyArrays: true,
            //     },
            // },
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

        const result = await Order.aggregate(pipeline);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.totalCount[0]?.count || 0;

        const response = {
            status: RESPONSE_STATUS.SUCCESS,
            message: RESPONSE_MESSAGES.RETRIEVE("Orders"),
            data,
            totalCount,
            currentCount: data.length,
            httpStatus: HTTP_STATUS.OK,
        };

        await setCache(cacheKey, response, 120);

        return response;

    } catch (error) {
        console.error("getAllOrders error:", error);
        return errorResponse(
            error.message || "Something went wrong",
            HTTP_STATUS.SERVER_ERROR
        );
    }
};
