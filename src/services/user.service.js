import User from "../models/user.model.js";
import Notification from "../models/notification.model.js"
import Audit from "../models/audit.model.js"
import Raffle from "../models/raffle.model.js";
import Order from "../models/order.model.js";
import RaffleEarning from "../models/raffleEarning.model.js"

import { DEFAULT_SETTINGS, HTTP_STATUS, RAFFAL_STATUS, RESPONSE_STATUS, ROLE_TYPE, USER_STATUS } from "../utils/constant.js";
import { addMinutesInDate, comparePasswords, errorResponse, generateOTP, hashPassword } from "../utils/index.js";
import { generateRefreshToken, generateToken, verifyToken } from "../utils/jwtUtils.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { ADMIN_EMAIL, FRONTEND_APP_URL, JWT_REFRESH_SECRET } from "../config/const.js";
import { generateAndSendOTP } from "./otp.service.js";
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { deleteCache, getCache, setCache } from "../utils/cacheService.js";
import { sendEmail } from "../utils/emailService.js";
import { getRegisterTemplate } from "../utils/emailTemplates/registerTemplate.js";
import { getPasswordChangeTemplate } from "../utils/emailTemplates/getPasswordChangeTemplate.js";
import { successPasswordTemp } from "../utils/emailTemplates/successPasswordTemp.js";
import { getPhoneChangeTemplate } from "../utils/emailTemplates/getPhoneOTPTemplate.js";
import mongoose from "mongoose";
import Ticket from "../models/ticket.model.js";
import { getForgotPasswordTemplate } from "../utils/emailTemplates/getForgotPasswordTemplate.js";


export const createUser = async (payload) => {
  try {
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.ALREADY_EXISTS("Email"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    payload.password = await hashPassword(payload.password);
    
    const user = await User.create(payload);

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "User creation failed",
        httpStatus: HTTP_STATUS.SERVER_ERROR,
      };
    }

    if (user.role === ROLE_TYPE.HOST) {
      return {
        status: RESPONSE_STATUS.SUCCESS,
        message: "Your account is created but pending admin approval. You can login once approved.",
        httpStatus: HTTP_STATUS.OK,
        code:false
      };
    } else {
      
      const emailSent = await generateAndSendOTP({ email: user.email });
    //   console.log("OTP generation and email sending result: ", emailSent); 

      if (emailSent) {
        return {
          status: RESPONSE_STATUS.SUCCESS,
          message: "OTP sent to your email successfully",
          httpStatus: HTTP_STATUS.OK,
          code:true
        };
      } else {
        return {
          status: RESPONSE_STATUS.ERROR,
          message: "User created, but failed to send OTP email",
          httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        };
      }
    }
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};

export const adminLogin = async (payload) => {
  try {
    // 1️⃣ Find User
    const user = await User.findOne({ email: payload.email });


    if (!user || user.role !== ROLE_TYPE.ADMIN) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Access denied. Admin privileges required.",
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 2️⃣ Pattern Check
    if (user.pattern !== Number(payload.pattern)) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Invalid Pattern",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 3️⃣ Password Check
    const isPasswordValid = await comparePasswords(
      payload.password,
      user.password || ""
    );

    if (!isPasswordValid) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 4️⃣ Two Factor Authentication
    if (user.twoFactorEnabled) {
      if (!payload.totp) {
        return {
          status: RESPONSE_STATUS.ERROR,
          message: "2FA code required",
          httpStatus: HTTP_STATUS.BAD_REQUEST,
        };
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: payload.totp, // ✅ FIXED
        window: 1,
      });

      if (!verified) {
        return {
          status: RESPONSE_STATUS.ERROR,
          message: "Invalid 2FA code",
          httpStatus: HTTP_STATUS.BAD_REQUEST,
        };
      }
    }

    // 5️⃣ Generate JWT

        const tokenPayload = {
      userId: user._id,
      role: user.role,
    };

    const token = generateToken(tokenPayload);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.LOGIN_SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      token,
      data: {
        id: user._id,
        username: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};
export const setup2FA = async (userId, payload) => {
  try{
       const user = await User.findById({_id: userId });

      if (!user && user.role != ROLE_TYPE.ADMIN) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Access denied. Admin privileges required.",
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

        if (payload.enable === false) {
      // Disable 2FA
      await User.findByIdAndUpdate(userId, {
        twoFactorSecret: null,
        twoFactorEnabled: false
      });

      return {
        status: RESPONSE_STATUS.SUCCESS,
        message: 'Two-factor authentication disabled successfully',
         httpStatus: HTTP_STATUS.OK,
      };
    }

        // Enable 2FA
    const secret = speakeasy.generateSecret({
      name: `Friday:${ADMIN_EMAIL}`,
      issuer: "RaffalStar",
      length: 20
    });

    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    await User.findByIdAndUpdate(userId, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: true
    });

    return{
      message: 'Two-factor authentication enabled successfully!',
      data:{
            secret: secret.base32,
            qrCodeUrl: secret.otpauth_url,
            qrCodeImage: qrCodeDataURL,
      },
      status: RESPONSE_STATUS.SUCCESS,
      httpStatus: HTTP_STATUS.OK,
    };

  }catch(error){
        console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
}

export const loginUser = async (payload, req) => {
  try {
    const { email, password } = payload;

    // 1️⃣ Find user (include password explicitly)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 2️⃣ Check user status
    if (user.status !== USER_STATUS.ACTIVE) {
      let message = "Invalid user status.";

      if (user.status === USER_STATUS.PENDING) {
        message =
          user.role === ROLE_TYPE.ENTRANT
            ? "Please verify your email before logging in."
            : "Your account is pending admin approval.";
      }

      if (user.status === USER_STATUS.BLOCKED) {
        message = "Your account has been blocked.";
      }

      if (user.status === USER_STATUS.BANNED) {
        message = "Your account has been banned.";
      }

      if (user.status === USER_STATUS.INACTIVE) {
        message = "Your account is inactive.";
      }

      return {
        status: RESPONSE_STATUS.ERROR,
        message,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 3️⃣ Check password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 4️⃣ Generate Tokens (minimal payload)
    const tokenPayload = {
      userId: user._id,
      role: user.role,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

        // ✅ Audit log create
    await Audit.create({
      userId: user._id, // admin or user who performed action
      action: "LOGGED_IN_USER",
      changes: {payload},
      ipAddress: req.ip,
      message: `User logged In`,
      userAgent: req.headers["user-agent"],
    });

    // 5️⃣ Save refresh token (single session)
    user.refreshToken = refreshToken;
    await user.save();

    // 6️⃣ Return response
    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.LOGIN_SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      data: {
        accessToken,
        refreshToken,
      },
    };

  } catch (error) {
    console.error("Login Error:", error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const refreshToken = async (token) =>{

  // console.log('dsdsad', token)

      const isBlacklisted = await getCache(
      `blacklist:refreshToken:${token}`
    );

    if (isBlacklisted) {
      return{
    status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.NOT_FOUND('User'),
      httpStatus: HTTP_STATUS.UNAUTHORIZED,
  }
    }


  let decoded;
  try{
    decoded = verifyToken(token, JWT_REFRESH_SECRET);
    console.log('decoded', decoded)

const user = await User.findById(decoded.userId)
if(!user || user.refreshToken !== token){
  return{
    status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.NOT_FOUND('User'),
      httpStatus: HTTP_STATUS.UNAUTHORIZED,
  }
}

    const tokenPayload = {
      userId: user._id,
      role: user.role,
    };

const accessToken = generateToken(tokenPayload)

const refreshToken = generateRefreshToken(tokenPayload)


user.refreshToken = refreshToken

await user.save()

   return {
      status: RESPONSE_STATUS.SUCCESS,
      message: 'success',
      httpStatus: HTTP_STATUS.OK,
      data: {
        accessToken,
        refreshToken,
      },
    };

  }catch(err){
        console.error(err);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
}

export const validateToken = async (token) => {
  if (!token) throw new Error("Your session is expired!");

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    // throw new Error("Forbidden: Invalid or expired token");
    throw new Error("Your session is expired!");
  }

  const user = await User.findOne({ _id: decoded.userId, isBlocked: false, isDeleted: false });
  if (!user) throw new Error("Unauthorized: User not found or blocked/deleted");

  return user;
};

export const getAllUsers = async (userId, query) => {
  try {

    const matchCriteria = {
      isDeleted: false,
      role: { $ne: ROLE_TYPE.ADMIN }
    };

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const keyword = query.keyword?.trim();

    const cacheKey = `users:${page}:${limit}:${keyword || "all"}`;

    // ✅ Check Redis Cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // ✅ Verify Admin
    const user = await User.findById(userId).select("role");

    if (user && user.role !== ROLE_TYPE.ADMIN) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.UNAUTHORIZED,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // ✅ Search keyword
    if (keyword) {
      matchCriteria.$or = [
        { userName: { $regex: keyword, $options: "i" } },
        { firstName: { $regex: keyword, $options: "i" } },
        { lastName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: matchCriteria },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                otp: 0,
                password: 0,
                expiresIn: 0
              }
            }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ];

    // ✅ Run aggregation
    const result = await User.aggregate(pipeline);

    const data = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Data"),
      httpStatus: HTTP_STATUS.OK,
      data,
      totalCount: total,
      currentCount: data.length,
    };

    // ✅ Save to Redis (TTL 2 minutes)
    await setCache(cacheKey, response, 120);

    return response;

  } catch (error) {
    console.error("getAllUsers Service Error:", error);

    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};

export const getUserById = async ({ id }) => {
  if (!id) {
    return {
      status: RESPONSE_STATUS.ERROR,
      message: "User 'id' must be provided",
      httpStatus: HTTP_STATUS.BAD_REQUEST,
    };
  }

  try {
    const user = await User.findById(id)
      .select("-password -tokens -__v") // secure & lean
      .lean(); // plain JS object

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("User"),
      httpStatus: HTTP_STATUS.OK,
      data: user,
    };
  } catch (error) {
    console.error("getUserById error:", error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const getUserProfile = async (username) => {
  try {
    // Aggregation pipeline
    const pipeline = [
      { $match: { userName: { $regex: `^${username.trim()}$`, $options: "i" } } },

      // Lookup raffles created by this user
      {
        $lookup: {
          from: "raffles",
          localField: "_id",
          foreignField: "userId",
          as: "raffles",
          pipeline: [{ $project: { _id: 1 } }]
        }
      },

      // Count total raffles
      {
        $addFields: {
          totalRaffles: { $size: "$raffles" }
        }
      },

      // Lookup winners (tickets where isWinner: true)
      {
        $lookup: {
          from: "tickets",
          let: { raffleIds: "$raffles._id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $in: ["$raffleId", "$$raffleIds"] }, { $eq: ["$isWinner", true] }] } } },
            { $project: { _id: 1 } }
          ],
          as: "winners"
        }
      },

      // Count total winners
      {
        $addFields: {
          totalWinners: { $size: "$winners" }
        }
      },

      // Exclude sensitive fields
      {
        $project: {
          password: 0,
          __v: 0,
          refreshToken: 0,
          twoFactorEnabled: 0,
          tempEmail: 0,
          tempPassword: 0,
          tempPhone: 0,
          raffles: 0,
          winners: 0
        }
      }
    ];

    const result = await User.aggregate(pipeline);

    if (!result || !result.length) {
      return {
        status: "error",
        message: `User not found`,
        httpStatus: 404
      };
    }

    return {
      status: "success",
      message: "User retrieved successfully",
      httpStatus: 200,
      data: result[0]
    };
  } catch (error) {
    console.error("getUserProfile error:", error);
    return {
      status: "error",
      message: "Something went wrong",
      httpStatus: 500
    };
  }
};

export const updateUser = async (id, files, body, req) => {
  try {
    const updateData = { ...body };

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return {
        status: RESPONSE_STATUS.FAIL,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    // avatar
    if (files?.avatar?.length > 0) {
      updateData.avatar = files.avatar[0].relativePath;
    }

    // cover image
    if (files?.coverImage?.length > 0) {
      updateData.coverImage = files.coverImage[0].relativePath;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument:'after' }
    );

    // ✅ Notification create
    await Notification.create({
      userId: id,
      message: "Your profile has been updated successfully",

    });

    // ✅ Audit log create
    await Audit.create({
      userId: req.user?._id, // admin or user who performed action
      action: "UPDATE_USER",
      changes: updateData,
      ipAddress: req.ip,
      message: `User profile updated`,
      userAgent: req.headers["user-agent"],
    });

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Profile"),
      httpStatus: HTTP_STATUS.OK,
      data: updatedUser,
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const checkUsername = async (id, username) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    const existingUser = await User.findOne({ 
      userName: { $regex: `^${username.trim()}$`, $options: "i" },
      _id: { $ne: id }
    });

    if (existingUser) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Sorry! This username is already taken. Please choose another one.",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "Great! This username is available ✅",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const checkUsernameExist = async (userId) => {
  try {

    const user = await User.findById(userId).select("userName");

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    if (!user.userName) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Username not set for this user",
        httpStatus: HTTP_STATUS.OK,
        data: {
          hasUsername: false
        }
      };
    }

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "Username exists",
      httpStatus: HTTP_STATUS.OK,
      data: {
        hasUsername: true,
      },
    };

  } catch (error) {
    console.error(error);

    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const updateUserStatus = async (userId, admin, payload) => {
  try {
    if (admin.role !== ROLE_TYPE.ADMIN) {
    return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.UNAUTHORIZED,
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
  }

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }


const updatedUser = await User.findByIdAndUpdate(userId, {$set:payload}, {returnDocument:'after'})

 if (!updatedUser) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

        await deleteCache("users:*");
    
    
  

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED('User'),
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};

export const getProfile = async (userId) => {
  try {

    const user = await User.findById(userId).select('-password -provider -twoFactorEnabled -tempEmail -tempPassword -tempPhone -otp -expiresIn -isDeleted');

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND('User'),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE('Profile'),
      httpStatus: HTTP_STATUS.OK,
      user
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR,
    };
  }
};

export const forgotAdminPassword = async (email) => {

  try {

    const user = await User.findOne({ email, role: ROLE_TYPE.ADMIN });

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND('Admin user'),
        httpStatus: HTTP_STATUS.NOT_FOUND,
      };
    }

    const otp = generateOTP();


        // 3️⃣ Update OTP & Expiry using update query
       await User.findOneAndUpdate(
      { email: email, isEmailVerified: true },
      { $set: { otp, expiresIn: addMinutesInDate(DEFAULT_SETTINGS.OTP_EXPIRY_MINUTES) } },
      { returnDocument: 'after' } // <-- updated
    );

        const username = `${user.firstName} ${user.lastName}`;

             sendEmail(
              user.email,
              "RaffalStar Admin Password Reset OTP",
              getForgotPasswordTemplate(username, otp)
            );

            return {
              status: RESPONSE_STATUS.SUCCESS,
              message: "OTP sent to your email successfully",
              httpStatus: HTTP_STATUS.OK,
            };

    
  } catch (error) {
    console.error("admin forgot password error:", error);
    return errorResponse(
      error.message || RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      HTTP_STATUS.SERVER_ERROR
    );
  }

}

export const resetAdminPassword = async (payload) => {
  try {
    const { email, newPassword } = payload;
    const user = await User.findOne({ email, role: ROLE_TYPE.ADMIN });

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Admin user"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }


        const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;
    user.otp = null;
    user.expiresIn = null;

    await user.save();
        const username = `${user.firstName} ${user.lastName}`;


    // 4️⃣ Send Email
     sendEmail(
      user.email,
      "Your password has been changed",
      successPasswordTemp(username)
    );
    console.log('helll', user)

       return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.PASSWORD_CHANGED,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: error.message,
        httpStatus: HTTP_STATUS.SERVER_ERROR,
    }
  }
};

export const adminChangePassword = async (payload) => {
  try {
    const { userId, oldPassword, newPassword, pattern } = payload;
    const user = await User.findById(userId);

    if (!user || user.role !== ROLE_TYPE.ADMIN) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("Admin user"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }


    const isPasswordValid = await comparePasswords(oldPassword, user.password);
    if (!isPasswordValid) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.pattern = pattern || user.pattern;
    await user.save();

    const username = `${user.firstName} ${user.lastName}`;

     sendEmail(
      user.email,
      "Your password has been changed",
        (username)
    );

       return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.PASSWORD_CHANGED,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: error.message,
        httpStatus: HTTP_STATUS.SERVER_ERROR,
    }
}


}

export const findOrCreateSocialUser = async (payload) => {

  let user = await User.findOne({ email:payload.email });

  if (!user) {
    user = await User.create({...payload, isEmailVerified:true, status:USER_STATUS.ACTIVE});
  }

  return user;
};

export const logoutUser = async ({ accessToken, refreshToken }) => {
  try {
    const promises = [];

    // ✅ Access Token blacklist (short expiry)
    if (accessToken) {
      const accessTTL = 15 * 60; // 15 min (ya JWT expiry ke hisaab se)
      promises.push(
        setCache(`blacklist:accessToken:${accessToken}`, true, accessTTL)
      );
    }

    // ✅ Refresh Token blacklist (long expiry)
    if (refreshToken) {
      const refreshTTL = 7 * 24 * 60 * 60; // 7 days
      promises.push(
        setCache(`blacklist:refreshToken:${refreshToken}`, true, refreshTTL)
      );
    }

    await Promise.all(promises);

    return {
      message: "Logout successful",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    throw error;
  }
};

export const getNotifications = async (userId, query) => {
  try {
    const matchCriteria = {};
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `notifications:${page}:${limit}:${userId || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Match notifications for this user OR forAll notifications
    if (userId) {
      matchCriteria.$or = [
        { userId: new mongoose.Types.ObjectId(userId) },
        { forAll: true }
      ];
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
                lastname: 1,
                email: 1,
                userName: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$users",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
          // ✅ Count unread BEFORE marking them read
          unreadCount: [
            { $match: { isRead: false } },
            { $count: "count" }
          ],
        },
      },
    ];

    const result = await Notification.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const unreadCount = result[0]?.unreadCount[0]?.count || 0;

    // ✅ Mark fetched notifications as read
    const notificationIds = data.map((n) => n._id);
    if (notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, isRead: false }, // only update unread ones
        { $set: { isRead: true } }
      );
    }

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Notifications"),
      data,
      totalCount,
      currentCount: data.length,
      unreadCount,         // ✅ unread count before marking read
      httpStatus: HTTP_STATUS.OK,
    };

    // ✅ Cache the response after building it
    await setCache(cacheKey, response);

    return response;

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const requestEmailChange = async (userId, payload) => {
  try {
    const { email: newEmail, password } = payload;

    // 1️⃣ Get logged-in user
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 2️⃣ Check password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 3️⃣ Check new email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.ALREADY_EXISTS("Email"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 4️⃣ Generate OTP
    const otp = generateOTP();

    // 5️⃣ Save temp email + OTP
    await User.findByIdAndUpdate(userId, {
      tempEmail: newEmail,
      otp,
      expiresIn: addMinutesInDate(DEFAULT_SETTINGS.OTP_EXPIRY_MINUTES),
    });

     const username = `${user.firstName} ${user.lastName}`;

    // 6️⃣ Send OTP to NEW email
    sendEmail(
      newEmail,
      "Verify your new email",
      getRegisterTemplate(username, newEmail, otp)
    );

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "OTP sent to new email",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const verifyEmailChangeOTP = async (userId, payload, req) => {
  try {
    const { otp } = payload;
    // console.log('userId', userId)
    // 1️⃣ Get user
    const user = await User.findById(userId);

    if (!user || !user.tempEmail) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Invalid request",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 2️⃣ Check OTP
    if (user.otp !== otp) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_OTP,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 3️⃣ Check expiry
    if (user.expiresIn < new Date()) {
      return {
        status: RESPONSE_STATUS.ERROR,
         message: "Your OTP has expired. Please request a new one.",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 4️⃣ FINAL UPDATE
    await User.findByIdAndUpdate(userId, {
      email: user.tempEmail,
      tempEmail: null,
      otp: null,
      expiresIn: null,
    });


        await Notification.create({
      userId: userId,
      message: "Email has been updated successfully",

    });

    // ✅ Audit log create
    await Audit.create({
      userId: userId, // admin or user who performed action
      action: "UPDATE_EMAIL",
      changes: {email: user.tempEmail},
      ipAddress: req.ip,
      message: `User phone nummber updated`,
      userAgent: req.headers["user-agent"],
    });

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED("Email"),
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const requestPasswordChange = async (userId, payload) => {
  try {
    const { currentPassword, newPassword } = payload;

    // 1️⃣ Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 2️⃣ Verify current password
    const isMatch = await comparePasswords(currentPassword, user.password);
    if (!isMatch) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Current password is incorrect",
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }

    // 3️⃣ Hash new password (IMPORTANT 🔥)
    const hashedPassword = await hashPassword(newPassword);

    // 4️⃣ Generate OTP
    const otp = generateOTP();

    // 5️⃣ Save temp password + OTP
    await User.findByIdAndUpdate(userId, {
      tempPassword: hashedPassword,
      otp,
      expiresIn: addMinutesInDate(DEFAULT_SETTINGS.OTP_EXPIRY_MINUTES),
    });

         const username = `${user.firstName} ${user.lastName}`;


    // 6️⃣ Send OTP to user's email
    sendEmail(
      user.email,
      "Verify Password Change",
      getPasswordChangeTemplate(username, otp)
    );

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "OTP sent to your email",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const verifyPasswordChangeOTP = async (userId, payload, req) => {
  try {
    const { otp } = payload;

    // 1️⃣ Get user
    const user = await User.findById(userId);

    if (!user || !user.tempPassword) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Invalid request",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 2️⃣ Check OTP
    if (user.otp !== otp) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_OTP,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 3️⃣ Check expiry
    if (user.expiresIn < new Date()) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "OTP expired",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

             const username = `${user.firstName} ${user.lastName}`;


    // 4️⃣ FINAL UPDATE PASSWORD
    await User.findByIdAndUpdate(userId, {
      password: user.tempPassword,
      tempPassword: null,
      otp: null,
      expiresIn: null,
    });

        await Notification.create({
      userId: userId,
      message: "Password has been updated successfully",

    });

    // ✅ Audit log create
    await Audit.create({
      userId: userId, // admin or user who performed action
      action: "UPDATE_PASSWORD",
      changes: {password: user.tempPassword},
      ipAddress: req.ip,
      message: `User phone nummber updated`,
      userAgent: req.headers["user-agent"],
    });


      sendEmail(
          user.email,
          "Your password has been changed",
          successPasswordTemp(username)
        );

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED('Password'),
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const requestPhoneChange = async (userId, payload) => {
  try {
    const { phoneNo } = payload;


    // 2️⃣ Get user
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }


    // 4️⃣ Check if same number
    if (user.phoneNo === phoneNo) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "New phone cannot be same as old phone",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 5️⃣ Check phone exists
    const existingUser = await User.findOne({ phone: phoneNo });
    if (existingUser) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.ALREADY_EXISTS("Phone"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 6️⃣ Generate OTP
    const otp = generateOTP();
    

    // 7️⃣ Save temp phone + OTP
    await User.findByIdAndUpdate(userId, {
      tempPhone: phoneNo,
      otp,
      expiresIn: addMinutesInDate(DEFAULT_SETTINGS.OTP_EXPIRY_MINUTES),
    });

             const username = `${user.firstName} ${user.lastName}`;


    // 8️⃣ Send OTP
sendEmail(
  user.email,
  "Verify Phone Number Update",
  getPhoneChangeTemplate(username, phoneNo, otp)
);

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "OTP sent to your email",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const verifyPhoneChangeOTP = async (userId, payload, req) => {
  try {
    const { otp } = payload;
    // 1️⃣ Get user
    const user = await User.findById(userId);

    if (!user || !user.tempPhone) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Invalid request",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 2️⃣ Check OTP
    if (user.otp !== otp) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_OTP,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 3️⃣ Check expiry
    if (user.expiresIn < new Date()) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "OTP expired",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 4️⃣ FINAL UPDATE PHONE
    await User.findByIdAndUpdate(userId, {
      phoneNo: user.tempPhone,
      tempPhone: null,
      otp: null,
      expiresIn: null,
    });

        // ✅ Notification create
    await Notification.create({
      userId: userId,
      message: "Phone Number has been updated successfully",

    });

    // ✅ Audit log create
    await Audit.create({
      userId: userId, // admin or user who performed action
      action: "UPDATE_PHONE",
      changes: {phoneNo: user.tempPhone},
      ipAddress: req.ip,
      message: `User phone nummber updated`,
      userAgent: req.headers["user-agent"],
    });

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.UPDATED('Phone number'),
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAllWinners = async (query) => {
  try {
    const { page, limit, categoryId } = query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Match winners
    const matchCriteria = { isWinner: true };

    // Cache key
    const cacheKey = `winners:${pageNumber}:${limitNumber}:${categoryId || "all"}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchCriteria },
      {$sort: { createdAt: -1 }},

      // Lookup raffle details
      {
        $lookup: {
          from: "raffles",
          localField: "raffleId",
          foreignField: "_id",
          as: "raffle",
          pipeline: [
            { $project: { title: 1, category: 1, userId: 1, featureMedia: 1 } }
          ]
        }
      },
      { $unwind: "$raffle" },
      // Filter by categoryId if provided
      ...(categoryId ? [{ $match: { "raffle.category": categoryId } }] : []),

      // Filter by categoryId if provided
      ...(categoryId ? [{ $match: { "raffle.category": categoryId } }] : []),

      // Lookup user who won
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { firstName: 1, lastName: 1, userName: 1, email: 1 } }]
        }
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // Lookup user who hosted the raffle
      {
        $lookup: {
          from: "users",
          localField: "raffle.userId",
          foreignField: "_id",
          as: "host",
          pipeline: [{ $project: { firstName: 1, lastName: 1, userName: 1, email: 1, avatar:1 } }]
        }
      },
      { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },

            {
        $lookup: {
          from: "prizeverifications",
          localField: "raffle._id",
          foreignField: "raffleId",
          as: "winnerProof",
          pipeline: [{ $project: { winnerProof: 1, } }]
        }
      },
      { $unwind: { path: "$winnerProof", preserveNullAndEmptyArrays: true } },

      // Pagination and total count
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNumber }],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const result = await Ticket.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Raffle"),
      data,
      totalCount,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK
    };

    await setCache(cacheKey, response, 120);
    return response;
  } catch (error) {
    console.log("error", error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR
    };
  }
};

export const getAllWinnersByHost = async (hostId, query) => {
  try {
    const { page, limit } = query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Match winners
    const matchCriteria = { isWinner: true };

    // Cache key
    const cacheKey = `hostWinners:${hostId}:${pageNumber}:${limitNumber}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // Build aggregation pipeline
    const pipeline = [
      { $match: matchCriteria },
      {$sort: { createdAt: -1 }},

      // Lookup raffle details
      {
        $lookup: {
          from: "raffles",
          localField: "raffleId",
          foreignField: "_id",
          as: "raffle",
          pipeline: [
            { $project: { title: 1, category: 1, userId: 1, featureMedia: 1 } }
          ]
        }
      },
      { $unwind: "$raffle" },
      { $match: { "raffle.userId": new mongoose.Types.ObjectId(hostId) } },

      // Lookup user who won
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "winner",
          pipeline: [{ $project: { firstName: 1, lastName: 1, userName: 1, email: 1, avatar: 1 } }]
        }
      },
      { $unwind: { path: "$winner", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "raffle.userId",
          foreignField: "_id",
          as: "host",
          pipeline: [{ $project: { firstName: 1, lastName: 1, userName: 1, email: 1, avatar:1 } }]
        }
      },
      { $unwind: { path: "$host", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "prizeverifications",
          localField: "raffle._id",
          foreignField: "raffleId",
          as: "winnerProof",
          pipeline: [{ $project: { winnerProofAt: 1 , winnerProof: 1} }]
        }
      },
      { $unwind: { path: "$winnerProof", preserveNullAndEmptyArrays: true } },

      // Pagination and total count
      {
        $facet: {
          data: [
            { $skip: skip }, 
            { $limit: limitNumber },
             {
        $project: {
          _id: 0, // optional (remove if needed)

          winnerProof: "$winnerProof.winnerProof",
          winnerProofAt: "$winnerProof.winnerProofAt",
          winnerAvatar: "$winner.avatar",
          winnerName: {
            $concat: [
              { $ifNull: ["$winner.firstName", ""] },
              " ",
              { $ifNull: ["$winner.lastName", ""] }
            ]
          },

          hostName: {
            $concat: [
              { $ifNull: ["$host.firstName", ""] },
              " ",
              { $ifNull: ["$host.lastName", ""] }
            ]
          },

          raffleTitle: "$raffle.title"
        }
      }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const result = await Ticket.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    const response = {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RETRIEVE("Winner"),
      data,
      totalCount,
      currentCount: data.length,
      httpStatus: HTTP_STATUS.OK
    };

    await setCache(cacheKey, response, 120);
    return response;
  } catch (error) {
    console.log("error", error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.SERVER_ERROR
    };
  }
}

export const getAdminDashStats = async () =>{
  try {

    // ─── Cache ───────────────────────────────────────────────────────────────
    const cacheKey   = `dashboard:admin:stats`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) return cachedData;

    // ─── All queries parallel ─────────────────────────────────────────────────
    const [
      activeRaffles,
      pendingApprovals,
      activeUsers,
      salesData,
      escrowData,
    ] = await Promise.all([

      // 1. Active raffles — approved + not ended
      Raffle.countDocuments({
        status:        RAFFAL_STATUS.APPROVE,
        raffleEndDate: { $gte: new Date() },
      }),

      // 2. Pending approvals — submitted but not reviewed yet
      Raffle.countDocuments({
        status: RAFFAL_STATUS.PENDING,
      }),

      // 3. Active users — verified + not blocked + not deleted
      User.countDocuments({
        isEmailVerified: true,
        isBlocked:       false,
        isDeleted:       false,
        status:          USER_STATUS.ACTIVE,
      }),

      // 4. Sales volume — total successful orders
      Order.aggregate([
        { $match: { paymentStatus: "success" } },
        {
          $group: {
            _id:         null,
            totalSales:  { $sum: "$amount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),

      // 5. Escrow balance — all locked earnings
      RaffleEarning.aggregate([
        {
          $group: {
            _id:            "$status",
            totalAmount:    { $sum: "$netAmount" },
            totalGross:     { $sum: "$grossAmount" },
            totalFees:      { $sum: "$platformFee" },
            count:          { $sum:1 },
          },
        },
      ]),

    ]);

    // ─── Parse sales ─────────────────────────────────────────────────────────
    const salesVolume  = salesData?.[0]?.totalSales  || 0;
    const totalOrders  = salesData?.[0]?.totalOrders || 0;

    // ─── Parse escrow ─────────────────────────────────────────────────────────
    const escrowLocked   = escrowData.find((e) => e._id === "locked");
    const escrowReleased = escrowData.find((e) => e._id === "released");

    const escrowBalance     = escrowLocked?.totalAmount   || 0;
    const escrowGross       = escrowLocked?.totalGross    || 0;
    const escrowFees        = escrowLocked?.totalFees     || 0;
    const escrowCount       = escrowLocked?.count         || 0;
    const releasedBalance   = escrowReleased?.totalAmount || 0;
    const releasedCount     = escrowReleased?.count       || 0;

    // ─── Response ─────────────────────────────────────────────────────────────
    const response = {
      status:     RESPONSE_STATUS.SUCCESS,
      message:    RESPONSE_MESSAGES.RETRIEVE("Dashboard"),
      httpStatus: HTTP_STATUS.OK,
      data: {
        raffles: {
          active:          activeRaffles,
          pendingApproval: pendingApprovals,
        },
        users: {
          active: activeUsers,
        },
        sales: {
          volume:      salesVolume,
          totalOrders,
        },
        escrow: {
          locked: {
            balance:      escrowBalance,
            grossAmount:  escrowGross,
            platformFees: escrowFees,
            raffleCount:  escrowCount,
          },
          released: {
            balance:     releasedBalance,
            raffleCount: releasedCount,
          },
        },
      },
    };

    // Cache — 5 min
    await setCache(cacheKey, response, 60);
    return response;

  } catch (error) {
    console.error("getAdminDashboard Error:", error);
    return errorResponse(error.message || "Something went wrong");
  }
}
