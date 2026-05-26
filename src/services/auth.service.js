
import { forgetPassword, resetPassword } from "./otp.service.js";
import { adminChangePassword, adminLogin, forgotAdminPassword, getProfile, refreshToken, resetAdminPassword, setup2FA } from "./user.service.js";
import Audit from "../models/audit.model.js"
import { getCache, setCache } from "../utils/cacheService.js";
import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";


export const forgotPassword = async (payload) => {
  return await forgetPassword(payload);
};

export const resetPasswordService = async (payload) => {
  return await resetPassword(payload);
};

export const refreshTokenService = async (token) => {
  return await refreshToken(token);
};

export const adminLoginService = async (payload) => {
  return await adminLogin(payload);
};

export const setup2FAService = async (userId, payload) => {
  return await setup2FA(userId, payload);
};
export const getProfileService = async (userId) => {
  return await getProfile(userId);
};
export const adminForgotPassword = async (payload) => {
  return await forgotAdminPassword(payload.email);
};

export const adminResetPassword = async (payload) => {
  return await resetAdminPassword(payload);
};


export const changeAdminPassword = async (payload, userId) => {
  return await adminChangePassword({ ...payload, userId });
};



export const getAudits = async (userId, query) => {
  try {

    const matchCriteria = {}

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    const cacheKey = `audit:${page}:${limit}:${userId || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }


    const skip = (page - 1) * limit;


    if (query.userId) {
      matchCriteria.userId = query.userId;
    }

    const pipeline = [
      { $match: matchCriteria },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "users",
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                userName: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: "$users",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]

    const result = await Audit.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;




    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Audits"),
      data,
      totalCount,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};



