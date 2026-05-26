import mongoose from "mongoose";
import Ticket from '../models/ticket.model.js'
import Raffle from '../models/raffle.model.js'
import User from "../models/user.model.js";
import PrizeVerification from '../models/prizeVerification.model.js';
import Notification from "../models/notification.model.js"
import RaffleEarning from '../models/raffleEarning.model.js';
import Transaction from '../models/transaction.model.js';
import { DRAW_STATUS, HTTP_STATUS, PAYMENT_METHOD, RESPONSE_STATUS, ROLE_TYPE, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../utils/constant.js";
import { sendNotification } from "./notification.service.js";
import { deleteCache, getCache, setCache } from "../utils/cacheService.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { deleteFile, errorResponse } from "../utils/index.js";


export const getAllKycProof = async (query) => {
  try {
    const { page = 1, limit = 10, status, ticketNo } = query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // ✅ Create cache key (include filters)
    const cacheKey = `kycProof:${pageNumber}:${limitNumber}:${status || "all"}:${ticketNo || "none"}`;

    // ✅ Check cache FIRST
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    const matchCriteria = {};
    if (status) {
      matchCriteria.status = status;
    }

    const pipeline = [
      { $match: matchCriteria },

      // ✅ Lookup tickets
      {
        $lookup: {
          from: "tickets",
          localField: "ticketId",
          foreignField: "_id",
          as: "ticket",
        },
      },
      { $unwind: "$ticket" },

      // ✅ Apply ticketNo filter AFTER lookup
      ...(ticketNo
        ? [
            {
              $match: {
                "ticket.ticketNumber": {
                  $regex: ticketNo,
                  $options: "i", // case-insensitive
                },
              },
            },
          ]
        : []),


      // 🎯 Lookup winner (ticket owner)
      {
        $lookup: {
          from: "users",
          localField: "ticket.userId", // ⚠️ change if winnerId exists
          foreignField: "_id",
          as: "winner",
        },
      },
      {
        $unwind: {
          path: "$winner",
          preserveNullAndEmptyArrays: true,
        },
      },

      // ✅ Lookup raffles
      {
        $lookup: {
          from: "raffles",
          localField: "raffleId",
          foreignField: "_id",
          as: "raffle",
          // pipeline: [
          //   {
          //     $project: {
          //       title: 1,
          //       drawStatus: 1,
          //     },
          //   },
          // ],
        },
      },
      { $unwind: "$raffle" },

       // 🧑‍💼 Lookup host
  {
    $lookup: {
      from: "users",
      localField: "raffle.userId",
      foreignField: "_id",
      as: "host",
    },
  },
  {
    $unwind: {
      path: "$host",
      preserveNullAndEmptyArrays: true,
    },
  },

   {
    $project: {
      status: 1,
      ticketNumber: "$ticket.ticketNumber",
      kycDocument:1,
      kycSubmittedAt:1,
        kycApprovedAt:  1,

        hostDeliveryProof:  1,
         hostProofAt:  1,

        winnerProof:  1,
         adminApprovedAt:  1,
         raffleId:1,

      raffleTitle: "$raffle.title",
      // drawStatus: "$raffle.drawStatus",

      // 👇 Winner details
          winnerName: {
      $ifNull: [
        "$winner.userName",
        { $concat: ["$winner.firstName", " ", "$winner.lastName"] }
      ]
    },

      // 👇 Host details
         hostName: {
      $ifNull: [
        "$host.userName",
        { $concat: ["$host.firstName", " ", "$host.lastName"] }
      ]
    },
      // hostEmail: "$host.email",
    },
  },

      // ✅ Pagination + count
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

    const result = await PrizeVerification.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Prize"),
      data,
      totalCount,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK,
    };

    // ✅ Store in cache AFTER response is ready
    await setCache(cacheKey, response, 120);

    return response;

  } catch (error) {
    console.error("getAllKycProof error:", error);
    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};

export const kycApproved = async (id, payload) => {
  try {
    // ✅ get single record
    const prizeData = await PrizeVerification.findById(id);

    if (!prizeData) {
      return errorResponse("Ticket not found");
    }

    if (prizeData.status === DRAW_STATUS.KYC_APPROVED) {
      return errorResponse("KYC already approved");
    }


    const updateFields = { status: payload.status };

    if (payload.status === DRAW_STATUS.KYC_APPROVED) {
      updateFields.kycApprovedAt = new Date();
    }


    // ✅ update verification
    const verification = await PrizeVerification.findOneAndUpdate(
     { _id: id }, 
      updateFields,
      { returnDocument: "after" } // return updated document
    );


    if (!verification) {
      return errorResponse("Verification not found or already submitted");
    }

    // ✅ fetch raffle
    const raffle = await Raffle.findById(prizeData.raffleId).select("title");

    // ✅ update raffle status

    await Raffle.findByIdAndUpdate(prizeData.raffleId, {
      drawStatus: payload.status
    });

    await deleteCache("tickets:*");
    await deleteCache("raffal-by-user:*");

    // ✅ notification
    await sendNotification({
    userIds: [verification.winnerId],
    message: `Kyc aprroved successfully "${raffle?.title}". Please wait for host deliver prize.`,
  });
    await sendNotification({
    userIds: [verification.hostId],
    message: `Kyc aprroved successfully "${raffle?.title}". Please wait for host deliver prize.`,
  });



    return { status: RESPONSE_STATUS.SUCCESS, httpStatus:HTTP_STATUS.OK, message:'Kyc approved successfully!.' };

  } catch (error) {
    console.error("submitKyc error:", error);

    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};

export const submitKyc = async (ticketId, files) => {
  try {
    // ✅ get single record
    const prizeData = await PrizeVerification.findOne({ ticketId, status: DRAW_STATUS.KYC_PENDING })

    if (!prizeData) {
      return errorResponse("Ticket not found");
    }

    // ✅ file extract
    let document = null;
    if (files?.document?.length) {
       // delete old
            deleteFile(prizeData.kycDocument);
      document = files.document[0].relativePath;
    }

    if (!document) {
      return errorResponse("Document is required");
    }

    // ✅ update verification
    const verification = await PrizeVerification.findOneAndUpdate(
      { ticketId, status: DRAW_STATUS.KYC_PENDING },
      {
        kycDocument: document,
        kycSubmittedAt: new Date(),
        status: "kyc_submitted",
      },
      { returnDocument: 'after' }
    );

    if (!verification) {
      return errorResponse("Verification not found or already submitted");
    }

    // ✅ fetch raffle
    const raffle = await Raffle.findById(prizeData.raffleId).select("title");

    // ✅ update raffle status
    // await Raffle.findByIdAndUpdate(prizeData.raffleId, {
    //   drawStatus: DRAW_STATUS.PRIZE_IN_DELIVERY,
    // });
    await Raffle.findByIdAndUpdate(prizeData.raffleId, {
      drawStatus: DRAW_STATUS.KYC_SUBMITTED,
    });

    await deleteCache("tickets:*");

    // ✅ notification
    await sendNotification({
    roles: [ROLE_TYPE.ADMIN],
    message: `Winner submitted KYC for "${raffle?.title}". Please approve the KYC and notify the host to deliver the prize.`,
  });

    // await Notification.create({
    //   userId: verification.hostId,
    //   message: `Winner verified for "${raffle?.title}". Please deliver the prize.`,
    // });

    return { status: RESPONSE_STATUS.SUCCESS, httpStatus:HTTP_STATUS.OK, message:'Kyc submitted successfully. Please wait for admin approval.' };

  } catch (error) {
    console.error("submitKyc error:", error);

    return errorResponse(
      error.message || "Something went wrong",
      HTTP_STATUS.SERVER_ERROR
    );
  }
};


// Host — delivery proof upload kare
export const submitHostProof = async (raffleId, hostId, files) => {
  try {
    // 1. Validate prize data
    const prizeData = await PrizeVerification.findOne({
      raffleId,
      hostId,
      status: DRAW_STATUS.KYC_APPROVED,
    });

    if (!prizeData) {
      return errorResponse("Prize verification not found or not approved");
    }

    if(prizeData.status === DRAW_STATUS.PRIZE_IN_DELIVERY){
      return errorResponse("Delivery proof already submitted");
    }

    // 2. Handle document upload
    let document = prizeData.hostDeliveryProof || [];

    if (files?.document?.length) {
      // delete old files if exist
      if (document.length) {
        document.forEach((img) => deleteFile(img));
      }

      document = files.document.map((file) => file.relativePath);
    }

    // 3. Update prize verification
    await PrizeVerification.updateOne(
      { _id: prizeData._id },
      {
        $set: {
          hostDeliveryProof: document,
          hostProofAt: new Date(),
          status: DRAW_STATUS.PRIZE_IN_DELIVERY,
        },
      }
    );

    // 4. Update raffle status
    const raffle = await Raffle.findByIdAndUpdate(
      raffleId,
      { drawStatus: DRAW_STATUS.PRIZE_IN_DELIVERY },
      { returnDocument: 'after' }
    );

        await deleteCache("tickets:*");
    await deleteCache("raffal-by-user:*");

    // 5. Notify winner
    if (prizeData?.winnerId) {
      await sendNotification({
        userIds: [prizeData.winnerId],
        message: `Your prize for "${raffle?.title}" has been sent by the host 🎉. Once received, please upload proof in the Won Tickets section`,});
    }

      await sendNotification({
        roles: [ROLE_TYPE.ADMIN],
        message: `Host uploaded delivery proof for "${raffle?.title}". Please review.`,
      });

    // 6. Success response
    return {
      status: RESPONSE_STATUS.SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      message: "Delivery proof submitted successfully",
    };

  } catch (error) {
    console.error("submitHostProof Error:", error);
    return errorResponse("Something went wrong while submitting delivery proof");
  }
};

// Winner — receipt confirm kare (ticket page pe button)
export const submitWinnerProof = async (ticketId, winnerId, files) => {

  try {
    // 1. Validate prize data
    const prizeData = await PrizeVerification.findOne({
      ticketId,
      winnerId,
      status: DRAW_STATUS.PRIZE_IN_DELIVERY,
    });

    if (!prizeData) {
      return errorResponse("Prize verification not found or not in delivery stage");
    }

    if(prizeData.status === DRAW_STATUS.PROOF_SUBMITTED){
      return errorResponse("Proof already submitted");
    }

    // 2. Handle document upload
    let document = prizeData.winnerProof || [];

    if (files?.document?.length) {
      // delete old files if exist
      if (document.length) {
        document.forEach((img) => deleteFile(img));
      }

      document = files.document.map((file) => file.relativePath);
    }

    // 3. Update prize verification
    await PrizeVerification.updateOne(
      { _id: prizeData._id },
      {
        $set: {
          winnerProof: document,
          winnerProofAt: new Date(),
          status: DRAW_STATUS.PROOF_SUBMITTED,
        },
      }
    );

    // 4. Update raffle status
    const raffle = await Raffle.findByIdAndUpdate(
      prizeData.raffleId,
      { drawStatus: DRAW_STATUS.PROOF_SUBMITTED },
      { returnDocument: 'after' }
    );

        await deleteCache("tickets:*");
    await deleteCache("raffal-by-user:*");

    // 5. Notify host and admin
    await sendNotification({
      userIds: [prizeData.hostId],
      message: `Winner uploaded delivery proof for "${raffle?.title}".`,
    });

    await sendNotification({
      roles: [ROLE_TYPE.ADMIN],
      message: `Winner uploaded delivery proof for "${raffle?.title}". Please review and approve.`,
    });

    // 6. Success response
    return {
      status: RESPONSE_STATUS.SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      message: "Proof submitted successfully",
    };

  } catch (error) {
    console.error("submitWinnerProof Error:", error);
    return errorResponse("Something went wrong while submitting proof");
  }

};

// Admin — approve kare, escrow release
export const adminApproveAndRelease = async (raffleId, payload) => {
  const {adminNote, action} = payload
  // action = 'approve' | 'reject'
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const verification = await PrizeVerification.findOne({ raffleId }).session(session);
    const earning      = await RaffleEarning.findOne({ raffleId }).session(session);
    const raffle       = await Raffle.findById(raffleId).session(session);

    if (!verification || !earning || !raffle) {
      await session.abortTransaction();
      return errorResponse("Raffle, verification or earning record not found");
    }

    if(verification.status === DRAW_STATUS.COMPLETED){
      await session.abortTransaction();
      return errorResponse("Already Approved");
    }

    // ─── APPROVE ────────────────────────────────────────────────────────────
    if (action === 'approved') {



      // 1. Host wallet credit
      await User.findByIdAndUpdate(
        earning.userId,
        { $inc: { wallet: earning.netAmount } },
        { session }
      );

      await Transaction.create([{
      userId: earning.userId,
      amount: earning.netAmount,
      paymentMethod: PAYMENT_METHOD.INTERNAL,
      type: TRANSACTION_TYPE.RAFFLE_REWARD,
      status: TRANSACTION_STATUS.SUCCESS,
      response: {
        source: "raffle_reward",
        raffleId: raffle._id,
      }
    }], { session });

      // 2. Earning release
      await RaffleEarning.findByIdAndUpdate(earning._id, {
        status:     'released',
        releasedAt: new Date(),
      }, { session });

      // 3. Verification approved
      await PrizeVerification.findByIdAndUpdate(verification._id, {
        status: DRAW_STATUS.COMPLETED,
        adminApprovedAt: new Date(),
        adminNote,
      }, { session });

      // 4. Raffle completed
      await Raffle.findByIdAndUpdate(raffleId, {
        drawStatus: 'completed',
      }, { session });

      // 5. Host notify
      await Notification.create([{
        userId:  earning.hostId,
        message: `Prize delivery approved for "${raffle.title}". $${earning.netAmount} has been added to your wallet.`,
        // meta: {
        //   type:     NOTIFICATION_TYPE.WALLET_CREDITED,
        //   raffleId: raffle._id,
        // },
      }], { session });

      // 6. Winner notify
      await Notification.create([{
        userId:  verification.winnerId,
        message: `Your prize receipt for "${raffle.title}" has been verified. Enjoy your prize!`,
        // meta: {
        //   type:     NOTIFICATION_TYPE.PRIZE_COMPLETED,
        //   raffleId: raffle._id,
        // },
      }], { session });

      // Admin Notify
      await sendNotification({
      roles: [ROLE_TYPE.ADMIN],
      message: `The host has received their share of $${earning.netAmount} for the raffle "${raffle?.title}".`,
      }, { session });

      await session.commitTransaction();
          await deleteCache("tickets:*");
    await deleteCache("raffal-by-user:*");

      return {
        status:     RESPONSE_STATUS.SUCCESS,
        message:    "Prize approved and payment released to host wallet",
        httpStatus: HTTP_STATUS.OK,
      };
    }

    // ─── REJECT ─────────────────────────────────────────────────────────────
    if (action === 'rejected') {

      // 1. Verification rejected
      await PrizeVerification.findByIdAndUpdate(verification._id, {
        status:          'rejected',
        adminApprovedAt: new Date(),
        adminNote,
      }, { session });

      // 2. Previous winner ticket reset — redraw me eligible nahi hoga
      await Ticket.findByIdAndUpdate(raffle.winnerTicketId, {
        isWinner: false,
      }, { session });

      // 3. Raffle reset for redraw
      await Raffle.findByIdAndUpdate(raffleId, {
        drawStatus:     'kyc_pending', // redraw ke baad kyc_pending se start hoga
        winnerId:       null,
        winnerTicketId: null,
        kycDeadline:    null,
        $inc: { redrawCount: 1 },
      }, { session });

      // 4. Host notify — rejected
      await Notification.create([{
        userId:  earning.hostId,
        message: `Prize verification rejected for "${raffle.title}". Reason: ${adminNote}. A redraw will be conducted.`,
        meta: {
          type:     NOTIFICATION_TYPE.PRIZE_REJECTED,
          raffleId: raffle._id,
        },
      }], { session });

      // 5. Winner notify — rejected
      await Notification.create([{
        userId:  verification.winnerId,
        message: `Your prize verification for "${raffle.title}" was rejected. Reason: ${adminNote}.`,
        meta: {
          type:     NOTIFICATION_TYPE.PRIZE_REJECTED,
          raffleId: raffle._id,
        },
      }], { session });

      await session.commitTransaction();

      // 6. Commit ke baad redraw trigger — session ke bahar
      await drawRaffleWinner(raffleId, true); // isRedraw = true
    await deleteCache("tickets:*");
    await deleteCache("raffal-by-user:*");
      

      return {
        status:     RESPONSE_STATUS.SUCCESS,
        message:    "Prize rejected. Redraw has been initiated.",
        httpStatus: HTTP_STATUS.OK,
      };
    }
    await deleteCache("tickets:*");
    await deleteCache("raffal-by-user:*");
    // Invalid action
    await session.abortTransaction();
    return errorResponse("Invalid action. Use 'approve' or 'reject'", HTTP_STATUS.BAD_REQUEST);

  } catch (error) {
    await session.abortTransaction();
    console.error("adminApproveAndRelease Error:", error);
    return errorResponse("Something went wrong while processing prize verification", HTTP_STATUS.SERVER_ERROR);
  } finally {
    session.endSession();
  }
};
