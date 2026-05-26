import WithDrawal from "../models/withdrawal.model.js";
import Bank from "../models/bank.model.js";
import User from "../models/user.model.js"
import { DEFAULT_SETTINGS, DRAW_STATUS } from "../utils/constant.js";
import { errorResponse, resolveDateRange } from "../utils/index.js";
import { BANK_STATUS, HTTP_STATUS, RESPONSE_STATUS, ROLE_TYPE } from "../utils/constant.js";
import { sendNotification } from "./notification.service.js";
import { deleteCache, getCache, setCache } from "../utils/cacheService.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import Audit from "../models/audit.model.js"
import mongoose from "mongoose";

export const withdrawalRequest = async (payload, userId, req) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Check bank
    const bank = await Bank.findOne({ userId }).session(session);

    if (!bank || bank.status !== BANK_STATUS.VERIFIED) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Your bank is not verified. You are not eligible for withdrawal");
    }

    // 2. Get user
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("User not found");
    }

    const withdrawalAmount = payload.amount;
    const platformFees = DEFAULT_SETTINGS.PLATFORM_FEES;
    const totalDeduction = withdrawalAmount + platformFees;

    // 3. Balance checks
    if (user.wallet < platformFees) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Insufficient balance to cover platform fees");
    }

    if (user.wallet < totalDeduction) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse("Insufficient balance");
    }

    // 4. Deduct wallet
    user.wallet -= totalDeduction;
    await user.save({ session });

    // 5. Create withdrawal
    payload.userId = userId;
    payload.commission = platformFees;
    payload.status = DRAW_STATUS.PENDING;

    const result = await WithDrawal.create([payload], { session });

    // 6. Audit log
    await Audit.create(
      [
        {
          userId,
          action: "WITHDRAWAL_REQUEST_SUBMITTED",
          changes: {
            amount: withdrawalAmount,
            platformFees: platformFees,
          },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          message: `Withdrawal request submitted for amount ${withdrawalAmount}`,
        },
      ],
      { session }
    );

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 7. Notifications (outside transaction)
    await sendNotification({
      userIds: [userId],
      message: `Your withdrawal request has been submitted and is pending for approval.`,
    });

    await sendNotification({
      roles: [ROLE_TYPE.ADMIN],
      message: `A new withdrawal request has been submitted.`,
    });

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.CREATED("Withdrawal request"),
    //   data: result[0],
      httpStatus: HTTP_STATUS.SUCCESS,
    };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);

    return errorResponse("Something went wrong");
  }
};


// ─── User withdrawals ─────────────────────────────────────────────────────────
export const getUserWithdrawals = async (userId, query) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      date,
      startDate,
      endDate,
    } = query;

    const pageNumber  = Math.max(parseInt(page)  || 1, 1);
    const limitNumber = Math.max(parseInt(limit) || 10, 1);
    const skip        = (pageNumber - 1) * limitNumber;

    // ─── Cache ───────────────────────────────────────────────────────────────
    const cacheKey = `withdrawal:user:${userId}:${pageNumber}:${limitNumber}:${status || "all"}:${date || "all"}:${startDate || ""}:${endDate || ""}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // ─── Match ───────────────────────────────────────────────────────────────
    const matchCriteria = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (status) matchCriteria.status = status;

    const dateRange = resolveDateRange(date, startDate, endDate);
    if (dateRange) matchCriteria.createdAt = dateRange;

    // ─── Pipeline ────────────────────────────────────────────────────────────
    const pipeline = [];

    pipeline.push({ $match: matchCriteria });

    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({
      $facet: {
        data:       [{ $skip: skip }, { $limit: limitNumber }],
        totalCount: [{ $count: "count" }],
      },
    });

    // ─── Execute ─────────────────────────────────────────────────────────────
    const [result] = await WithDrawal.aggregate(pipeline);

    const data       = result?.data|| [];
    const totalCount = result?.totalCount?.[0]?.count || 0;

    const response = {
      status:       RESPONSE_STATUS.SUCCESS,
      message:      RESPONSE_MESSAGES.RETRIEVE("Withdrawal"),
      httpStatus:   HTTP_STATUS.OK,
      data,
      totalCount,
      currentCount: data.length,
    };

    await setCache(cacheKey, response, 60);
    return response;

  } catch (error) {
    console.error("getUserWithdrawals Error:", error);
    throw error;
  }
};


// ─── Admin withdrawals ────────────────────────────────────────────────────────
export const getAdminWithdrawals = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      keyword,
      date,
      startDate,
      endDate,
    } = query;

    const pageNumber  = Math.max(parseInt(page)  || 1, 1);
    const limitNumber = Math.max(parseInt(limit) || 10, 1);
    const skip        = (pageNumber - 1) * limitNumber;

    // ─── Cache ───────────────────────────────────────────────────────────────
    const cacheKey = `withdrawal:admin:${pageNumber}:${limitNumber}:${status || "all"}:${keyword || ""}:${date || "all"}:${startDate || ""}:${endDate || ""}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // ─── Match ───────────────────────────────────────────────────────────────
    const matchCriteria = {};

    if (status) matchCriteria.status = status;

    const dateRange = resolveDateRange(date, startDate, endDate);
    if (dateRange) matchCriteria.createdAt = dateRange;

    // ─── Keyword match stage ─────────────────────────────────────────────────
    const keywordMatch = keyword?.trim()
      ? [{
          $match: {
            $or: [
              { "user.firstName": { $regex: keyword.trim(), $options: "i" } },
              { "user.lastName":  { $regex: keyword.trim(), $options: "i" } },
              { "user.userName":  { $regex: keyword.trim(), $options: "i" } },
              { "user.email":     { $regex: keyword.trim(), $options: "i" } },
            ],
          },
        }]
      : [];

      console.log('matchcri', matchCriteria)

    // ─── Pipeline ────────────────────────────────────────────────────────────
    // const pipeline = [
    //   { $match: matchCriteria },
    //   {
    //     $lookup: {
    //       from:         "users",
    //       localField:   "userId",
    //       foreignField: "_id",
    //       as:           "user",
    //       pipeline: [{
    //         $project: {
    //           firstName: 1,
    //           lastName:  1,
    //           userName:  1,
    //           email:     1,
    //           avatar:    1,
    //         },
    //       }],
    //     },
    //   },
    //   { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    //   ...keywordMatch,   // keyword ho to inject, nahi to empty spread
    //   { $sort: { createdAt: -1 } },
    //   {
    //     $facet: {
    //       data:       [{ $skip: skip }, { $limit: limitNumber }],
    //       totalCount: [{ $count: "count" }],
    //     },
    //   },
    // ];
    const pipeline = [
  { $match: matchCriteria },
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
            userName: 1,
            email: 1,
            avatar: 1,
          },
        },
      ],
    },
  },
  { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  ...keywordMatch, // inject if keyword exists
  { $sort: { createdAt: -1 } },
  {
    $project: {
      _id: 1,
      amount: 1,
      commission: 1,
      status: 1,
      approvedAt: 1,
      rejectionReason: 1,
      email: "$user.email",
      userName: { $concat: ["$user.firstName", " ", "$user.lastName"] },
    },
  },
  {
    $facet: {
      data: [{ $skip: skip }, { $limit: limitNumber }],
      totalCount: [{ $count: "count" }],
    },
  },
];

    // ─── Execute ─────────────────────────────────────────────────────────────
    const [result] = await WithDrawal.aggregate(pipeline);

    const data       = result?.data                   || [];
    const totalCount = result?.totalCount?.[0]?.count || 0;

    const response = {
      status:       RESPONSE_STATUS.SUCCESS,
      message:      RESPONSE_MESSAGES.RETRIEVE("Withdrawal"),
      httpStatus:   HTTP_STATUS.OK,
      data,
      totalCount,
      currentCount: data.length,
    };

    await setCache(cacheKey, response, 60);
    return response;

  } catch (error) {
    console.error("getAdminWithdrawals Error:", error);
    throw error;
  }
};

export const getWithdrawalById = async (id) => {
  try {
    const cacheKey = `withdrawal:id:${id}`;
    const cachedData = await getCache(cacheKey)
    if(cachedData)return cachedData

   const result = await WithDrawal.findById(id).lean()

   if(!result) return errorResponse('No withdrawal Found')
  

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffle"),
      data: result,
      httpStatus: HTTP_STATUS.OK,
    };

    // cache for 2 minutes
    await setCache(cacheKey, response, 120);

    return response;

    
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const withdrawalApproved = async (payload, withdrawalId, adminId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let notificationMessage = "";
  let userId = null;

  try {
    const { status, rejectionReason } = payload;

    const withdrawal = await WithDrawal.findById(withdrawalId).session(session);

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== BANK_STATUS.PENDING) {
      throw new Error("Withdrawal already processed");
    }

    userId = withdrawal.userId;

    let updateData = { status };

    // ✅ APPROVED
    if (status === BANK_STATUS.VERIFIED) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = adminId;

      notificationMessage = "Your withdrawal request has been approved successfully.";
    }

    // ❌ REJECTED
    if (status === BANK_STATUS.REJECTED) {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;

      // 🔁 Wallet rollback
      await User.findByIdAndUpdate(
        withdrawal.userId,
        {
          $inc: {
            wallet: withdrawal.amount + withdrawal.commission,
          },
        },
        { session }
      );

      notificationMessage = `Your withdrawal request has been rejected. Reason: ${rejectionReason}`;
    }

    const updatedWithdrawal = await WithDrawal.findByIdAndUpdate(
      withdrawalId,
      { $set: updateData },
      { returnDocument: 'true', session }
    );

    await session.commitTransaction();
    session.endSession();

    // ✅ SINGLE notification call (after commit)
    if (notificationMessage) {
      await sendNotification({
        userIds: [userId],
        message: notificationMessage,
      });
    }

       return {
            status:     RESPONSE_STATUS.SUCCESS,
            message:    RESPONSE_MESSAGES.UPDATED('Withdrawal'),
            httpStatus: HTTP_STATUS.OK,
          };


  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return errorResponse(error.message || "Something went wrong");
  }
};