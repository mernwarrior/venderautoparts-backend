// services/bank.service.ts
import mongoose from "mongoose";
import Bank from "../models/bank.model.js"; // assume aapka bank model hai
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { deleteCache, getCache, setCache } from "../utils/cacheService.js";
import { deleteFile, errorResponse } from "../utils/index.js";
import { BANK_STATUS, HTTP_STATUS, RESPONSE_STATUS, ROLE_TYPE } from "../utils/constant.js";
import { sendNotification } from "./notification.service.js";
import Audit from "../models/audit.model.js"

// Create Bank
export const createBank = async (payload, userId, files, req) => {
  try {
    // 🔒 Check if user already has bank details
    const existingBank = await Bank.findOne({ userId });

    if (existingBank) {
      return errorResponse("You have already submitted bank details") 
    }

    // 📸 Handle file uploads
    if (files?.frontPhoto?.length) {
      payload.frontPhoto = files.frontPhoto[0].relativePath;
    }

    if (files?.backPhoto?.length) {
      payload.backPhoto = files.backPhoto[0].relativePath;
    }

    // 💾 Create bank
    const result = await Bank.create({ ...payload, userId });

    // 🔔 Notifications
    await sendNotification({
      userIds: [userId],
      message: `Your bank request has been submitted and is pending approval.`,
    });

    await sendNotification({
      roles: [ROLE_TYPE.ADMIN],
      message: `A new bank request has been submitted.`,
    });

    // 📝 Audit log
    await Audit.create([
      {
        userId,
        action: "BANK_REQUEST_SUBMITTED",
        changes: {
          bankId: result._id,
          ifscCode: result.ifscCode,
          bankName: result.bankName,
          accountNo: result.accountNo,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        message: `Bank request submitted for bank "${result.bankName}"`,
      },
    ]);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.CREATED("Bank"),
      data: result,
      httpStatus: HTTP_STATUS.SUCCESS,
    };
  } catch (error) {
    console.error("createBank error:", error);
    return errorResponse("Bank creation failed");
  }
};

// Update Bank
export const updateBank = async (bankId, payload, files, req) => {
  try {
    const bankExist = await Bank.findById(bankId);

    if (!bankExist) {
      return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Bank"));
    }
    // Handle file uploads
    if (files?.frontPhoto?.length) {
        deleteFile(bankExist.frontPhoto);
      payload.frontPhoto = files.frontPhoto[0].relativePath;
    }

    if (files?.backPhoto?.length) {
        deleteFile(bankExist.backPhoto);
      payload.backPhoto = files.backPhoto[0].relativePath;
    }

    const updateData = await Bank.findByIdAndUpdate(bankId, { ...payload, status: BANK_STATUS.PENDING }, { returnDocument: 'after' });
    if (!updateData) {
      return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Bank"));
    }

        await sendNotification({
      userIds: [bankExist.userId],
      message: `Your bank details have been updated and are pending approval.`,
    });

    await sendNotification({
      roles: [ROLE_TYPE.ADMIN],
      message: `Bank details for "${updateData.bankName}" have been updated and are pending approval.`,
    });

    // 📝 Audit log
    await Audit.create([
      {
            userId: bankExist.userId,
        action: "BANK_REQUEST_UPDATED",
        changes: {
          bankId: updateData._id,
          ifscCode: updateData.ifscCode,
          bankName: updateData.bankName,
          accountNo: updateData.accountNo,
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        message: `Bank request updated for bank "${updateData.bankName}"`,
      },
    ]);

    await deleteCache("banks:*");

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Bank"),
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error("updateBank error:", error);
    return errorResponse("Bank update failed");
  }
};

// Delete Bank
export const deleteBank = async (bankId) => {
  try {
    const bank = await Bank.findByIdAndDelete(bankId);
    if (!bank) {
      return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Bank"))
    }

    // Optional: delete associated files
        await Promise.all([bank.frontPhoto, bank.backPhoto]
        .filter(Boolean)
        .map(file => deleteFile(file))
        );

    await deleteCache("banks");

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.DELETED("Bank"),
      httpStatus: HTTP_STATUS.OK
    };
  } catch (error) {
    console.error("deleteBank error:", error);
    return errorResponse("Bank deletion failed");
  }
};

export const getBankByUserId = async (userId) => {
  try {
    const bank = await Bank.findOne({ userId }).lean();
    // console.log("Bank details for user:", bank);
    if (!bank) {
      return { status: "error", message: RESPONSE_MESSAGES.NOT_FOUND("Bank details for user"), httpStatus: 404 };
    }

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Bank"),
      data: bank,
      httpStatus: HTTP_STATUS.OK
    };
  } catch (error) {
    console.error("getBankByUserId error:", error);
    return errorResponse("Fetching bank details failed");
  }
}

// Get All Banks
export const getAllBanks = async (payload) => {
  try {
    const{page = 1, limit = 10, status, keyword} = payload;

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const matchCriteria = {};
        if (status && status !== "all") {
          matchCriteria.status = status;
        }

        const keywordMatchStage = keyword && keyword.trim()
            ? [
                {
                    $match: {
                    $or: [
                        { "user.userName": { $regex: keyword.trim(), $options: "i" } },
                        { "user.email": { $regex: keyword.trim(), $options: "i" } },
                    ],
                    },
                },
                ]
            : [];

    const cacheKey = `banks:${pageNumber}:${limitNumber}:${status || "all"}:${keyword || "none"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

   const pipeline = [
  { $match: matchCriteria },
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  ...keywordMatchStage,
  {
    $project: {
      bankName: 1,
      bankHolderName: 1,
      ifscCode: 1,
      accountNo: 1,
      status: 1,
      createdAt: 1,
      verifiedAt: 1,
      rejectedAt: 1,
      "user.email": 1,
    },
  },
  { $sort: { createdAt: -1 } },
  {
    $facet: {
      data: [{ $skip: skip }, { $limit: limitNumber }],
      totalCount: [{ $count: "count" }],
    },
  },
];

    const result = await Bank.aggregate(pipeline);
    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Bank"),
      data,
      totalCount,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK
    };

    await setCache(cacheKey, response, 120); // Cache for 2 minutes

    return response;
  } catch (error) {
    console.error("getAllBanks error:", error);
    return errorResponse("Fetching banks failed");
  }
};

// Get Bank by ID
export const getBankById = async (bankId) => {
  try {


    const bank = await Bank.findById(bankId).lean();
    if (!bank) return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Bank")) 

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Bank"),
      data: bank,
      httpStatus: HTTP_STATUS.OK
    };
  } catch (error) {
    console.error("getBankById error:", error);
    return errorResponse("Fetching bank failed");
  }
};

// Admin Approve Bank
export const adminApproveBank = async (bankId, payload) => {
  try {
    const bank = await Bank.findById(bankId);
    if (!bank) return errorResponse(RESPONSE_MESSAGES.NOT_FOUND("Bank"));

    const { status, rejectionReason } = payload;

    // ── Validate status transition ─────────────────────────────────────────
    const ALLOWED_STATUSES = [BANK_STATUS.APPROVED, BANK_STATUS.REJECTED];
    if (!ALLOWED_STATUSES.includes(status)) {
      return errorResponse(`Invalid status. Allowed: ${ALLOWED_STATUSES.join(", ")}`);
    }

    if (bank.status === status) {
      return errorResponse(`Bank is already ${status}`);
    }

    if (status === BANK_STATUS.REJECTED && !rejectionReason?.trim()) {
      return errorResponse("Rejection reason is required when rejecting a bank");
    }

    // ── Apply status ───────────────────────────────────────────────────────
    bank.status = status;

    if (status === BANK_STATUS.REJECTED) {
      bank.rejectionReason = rejectionReason.trim();
      bank.rejectedAt      = new Date();
      bank.verifiedAt      = null;
    } else if (status === BANK_STATUS.APPROVED) {
      bank.rejectionReason = "";
      bank.rejectedAt      = null;
      bank.verifiedAt      = new Date();
    }

    await bank.save();

    // ── Notify user ────────────────────────────────────────────────────────
    const notificationMsg =
      status === BANK_STATUS.APPROVED
        ? "Your bank account has been approved successfully."
        : `Your bank account was rejected. Reason: ${bank.rejectionReason}`;

    await sendNotification({userIds: [bank.userId], message: notificationMsg });

    await deleteCache("banks:*");

    return {
      status:     RESPONSE_STATUS.SUCCESS,
      message:    RESPONSE_MESSAGES.UPDATED("Bank status"),
    //   data:       bank,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error("adminApproveBank error:", error);
    return errorResponse("Bank approval failed");
  }
};