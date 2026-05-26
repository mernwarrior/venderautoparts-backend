import User from "../models/user.model.js";
import { HTTP_STATUS, RESPONSE_STATUS, ROLE_TYPE, USER_STATUS } from "../utils/constant.js";
import { getRegisterTemplate } from "../utils/emailTemplates/registerTemplate.js";
import { generateRefreshToken, generateToken, verifyToken } from "../utils/jwtUtils.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";
import { FRONTEND_APP_URL } from "../config/const.js";
import { DEFAULT_SETTINGS } from "../utils/constant.js";
import { sendEmail } from "../utils/emailService.js";
import { addMinutesInDate, generateOTP, hashPassword } from "../utils/index.js";
import { welcomeTemplate, successPasswordTemp, resetPasswordTemplate } from "../utils/emailTemplates/index.js";

export const generateAndSendOTP = async (payload) => {
  try {
    // 1️⃣ Check user
    const userDetails = await User.findOne({ email: payload.email });

    if (!userDetails) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (userDetails.isEmailVerified === true) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.VERIFIED_ACCOUNT,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 2️⃣ Generate OTP
    const otp = generateOTP();

    // 3️⃣ Update OTP & Expiry using update query
   await User.findOneAndUpdate(
  { email: payload.email, isEmailVerified: false },
  { $set: { otp, expiresIn: addMinutesInDate(DEFAULT_SETTINGS.OTP_EXPIRY_MINUTES) } },
  { returnDocument: 'after' } // <-- updated
);

    const username = `${userDetails.firstName} ${userDetails.lastName}`;

    // 4️⃣ Send Email
     sendEmail(
      userDetails.email,
      "RaffalStar Email Verification",
      getRegisterTemplate(username, userDetails.email, otp)
    );

    return true;

    // return {
    //   status: RESPONSE_STATUS.SUCCESS,
    //   message: RESPONSE_MESSAGES.OTP_SENT,
    //   httpStatus: HTTP_STATUS.OK,
    // };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};


export const resendOTP = async (payload) => {
  try {
    // 1️⃣ Check if user exists and not verified
    const userDetails = await User.findOne({ email: payload.email });

    if (!userDetails) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

        if (userDetails.isEmailVerified === true) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.VERIFIED_ACCOUNT,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
     }


    // 2️⃣ Generate new OTP
    const otp = generateOTP();

    // 3️⃣ Set OTP expiry (5 minutes)
    const expiresIn = addMinutesInDate(DEFAULT_SETTINGS.OTP_EXPIRY_MINUTES);

    // 4️⃣ Update user with new OTP and expiry
    await User.findByIdAndUpdate(
      userDetails._id,
      { $set: { otp, expiresIn } },
      { returnDocument: 'after' } // updated option for mongoose
    );

    const username = `${userDetails.firstName} ${userDetails.lastName}`;

    // 5️⃣ Send Email
     sendEmail(
      userDetails.email,
      "RaffalStar Resend Email Verification",
      getRegisterTemplate(username, userDetails.email, otp)
    );

    // 6️⃣ Return response
    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.OTP_SENT,
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};

export const verifyOTP = async (payload) => {
  try {
    const { email, otp: enteredOTP } = payload;

    // 1️⃣ Check if user exists and not already verified
    const userDetails = await User.findOne({ email});
    const isAdmin = userDetails.role === ROLE_TYPE.ADMIN;


    if (!userDetails) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }
    if (!isAdmin && userDetails.isEmailVerified === true) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.VERIFIED_ACCOUNT,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }


    // 2️⃣ Check if OTP matches
    if (userDetails.otp !== enteredOTP) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_OTP,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // 3️⃣ Check if OTP expired
    if (userDetails.expiresIn < new Date()) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Your OTP has expired. Please request a new one.",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const updateData = {
  status: USER_STATUS.ACTIVE,
  otp: null,
  expiresIn: null,
};

// Only set isEmailVerified for non-admin users
if (!isAdmin) {
  updateData.isEmailVerified = true;
}

const updatedUser = await User.findByIdAndUpdate(
  userDetails._id,
  { $set: updateData },
  { returnDocument: 'after' }
);




    const username = `${updatedUser.firstName} ${updatedUser.lastName}`;

    // 5️⃣ Send Welcome Email
    sendEmail(
      updatedUser.email,
      "Welcome to RaffalStar",
      welcomeTemplate(username)
    );

    // 6️⃣ Return success response
    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "OTP verified successfully!",
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};


export const verifyRegOTP = async (payload) => {
  try {
    const { email, otp: enteredOTP } = payload;

    const userDetails = await User.findOne({ email }).select("+password");

    if (!userDetails) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (userDetails.isEmailVerified === true) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.VERIFIED_ACCOUNT,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (userDetails.otp !== enteredOTP) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.INVALID_OTP,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (userDetails.expiresIn < new Date()) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Your OTP has expired. Please request a new one.",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    // ✅ Update user
    const updatedUser = await User.findByIdAndUpdate(
      userDetails._id,
      {
        $set: {
          isEmailVerified: true,
          status: USER_STATUS.ACTIVE,
          otp: null,
          expiresIn: null,
        },
      },
      { returnDocument: 'after' }
    );

    // ✅ Generate tokens (AUTO LOGIN)
    const tokenPayload = {
      userId: updatedUser._id,
      role: updatedUser.role,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // ✅ Save refresh token
    updatedUser.refreshToken = refreshToken;
    await updatedUser.save();

    // ✅ Send welcome mail
    const username = `${updatedUser.firstName} ${updatedUser.lastName}`;
    sendEmail(
      updatedUser.email,
      "Welcome to RaffalStar",
      welcomeTemplate(username)
    );

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: "OTP verified successfully!",
      httpStatus: HTTP_STATUS.OK,
      data: {
        accessToken,
        refreshToken,
      },
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};

export const forgetPassword = async (payload) => {
  try {
    // 1️⃣ Check user
    const userDetails = await User.findOne({ email: payload.email });

    if (!userDetails) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    if (!userDetails.isEmailVerified) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_VERIFIED_ACCOUNT,
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

    const username = `${userDetails.firstName} ${userDetails.lastName}`;
    const token = generateToken( { userId: userDetails._id }, "5m");
    const resetLink = `${FRONTEND_APP_URL}/auth/reset-password/${token}`;

    sendEmail(
      userDetails.email,
      "RaffalStar Password Recovery",
      resetPasswordTemplate(username, resetLink)
    );

    return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.RESET_LINK,
      httpStatus: HTTP_STATUS.OK,
    };

  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};

export const resetPassword = async (payload) => {
  try {
    const { token, password } = payload;
     // 1️⃣ Verify token
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: RESPONSE_MESSAGES.NOT_FOUND("User"),
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      };
    }

        const hashedPassword = await hashPassword(payload.password);

    user.password = hashedPassword;
    await user.save();
    // console.log('helll', user)
        const username = `${user.firstName} ${user.lastName}`;


    // 4️⃣ Send Email
     sendEmail(
      user.email,
      "Your password has been changed",
      successPasswordTemp(username)
    );
    // console.log('helll', user)

       return {
      status: RESPONSE_STATUS.SUCCESS,
      message: RESPONSE_MESSAGES.PASSWORD_CHANGED,
      httpStatus: HTTP_STATUS.OK,
    };
  } catch (error) {
    if (error.httpStatus) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: error.message === "Token has expired" ? RESPONSE_MESSAGES.RESET_LINK_EXPIRED : error.message,
        httpStatus: error.httpStatus,
      };
    }

    return {
      status: RESPONSE_STATUS.ERROR,
      message: RESPONSE_MESSAGES.SOMETHING_WENT_WRONG,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }
};