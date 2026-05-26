import express from "express";
import * as otpController from "../controllers/otp.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema } from "../validations/user.validation.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { resendOtpSchema, verifyOtpSchema } from "../validations/otp.validation.js";
import { otpSendLimiter } from "../config/rateLimiter.js";

const router = express.Router();

// router.post("/send", validate(registerSchema), otpController.generateAndSendOTP);
router.post("/resend", otpSendLimiter, validate(resendOtpSchema), otpController.resendOTP);
router.post("/verify", validate(verifyOtpSchema), otpController.verifyOTP);
router.post("/verify-reg", validate(verifyOtpSchema), otpController.verifyRegOTP);


export default router;