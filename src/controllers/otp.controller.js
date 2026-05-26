import { NODE_ENV } from "../config/const.js";
import * as otpService from "../services/otp.service.js";
import { RESPONSE_STATUS } from "../utils/constant.js";


export const generateAndSendOTP = async (req, res, next) => {
  try {
    const result = await otpService.generateAndSendOTP(req.body);

    res.status(result.httpStatus).json({
        message: result.message || RESPONSE_MESSAGES.SUCCESS,
        status: result.status || RESPONSE_STATUS.SUCCESS,
        // token: result.token || null, 
      });


  } catch (error) {
    next(error); 
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const result = await otpService.resendOTP(req.body);

    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status
      });


  } catch (error) {
    next(error); 
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const result = await otpService.verifyOTP(req.body);
    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        // token: result.token || null, 
      });


  } catch (error) {
    next(error); 
  }
};


export const verifyRegOTP = async (req, res, next) => {
  try {
    const result = await otpService.verifyRegOTP(req.body);

    if (result.status !== RESPONSE_STATUS.SUCCESS) {
      return res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
      });
    }

    const { accessToken, refreshToken } = result.data;

    // ✅ Cookie set (same as login)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(result.httpStatus).json({
      message: result.message,
      status: result.status,
      data: {
        accessToken,
      },
    });

  } catch (error) {
    next(error);
  }
};