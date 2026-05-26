import express from "express";
import * as kycController from "../controllers/kyc.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { adminReviewSchema, kycApprovalSchema, uploadDocSchema } from "../validations/kyc.validation.js";
import { createUploader } from "../utils/uploadMulter.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateObjectIdParam } from "../middlewares/validateObjectId.js";

const router = express.Router();

export const uploadKycFile = createUploader("kyc").fields([
  { name: "document", maxCount: 1 }

]);

export const uploadDeliveryFile = createUploader("kyc").fields([
  { name: "document", maxCount: 5 }

]);

// router.post("/send", validate(registerSchema), otpController.generateAndSendOTP);
router.patch("/submit/:ticketId", validateObjectIdParam,  authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadKycFile, validate(uploadDocSchema), kycController.submitKyc);
router.get("/prize", authMiddleware([ROLE_TYPE.ADMIN]), kycController.getAllKycProof);
router.patch("/approve/:id", validateObjectIdParam, validate(kycApprovalSchema), authMiddleware([ROLE_TYPE.ADMIN]), kycController.kycApproved);
router.patch("/delivery-doc/:raffleId", validateObjectIdParam, authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadDeliveryFile, validate(uploadDocSchema), kycController.submitHostProof);
router.patch("/prize-proof/:ticketId", validateObjectIdParam, authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadDeliveryFile, validate(uploadDocSchema), kycController.submitWinnerProof);
router.patch("/admin-review/:raffleId", validateObjectIdParam, authMiddleware([ROLE_TYPE.ADMIN]),validate(adminReviewSchema), kycController.adminApproveAndRelease);



// router.get("/", otpSendLimiter, validate(resendOtpSchema), kycController.getAllKycProof);
// router.patch("/proof", validate(verifyOtpSchema), kycController.submitHostProof);
// // router.post("/verify-reg", validate(verifyOtpSchema), kycController.submitWinnerProof);
// router.patch("/approve", validate(verifyOtpSchema), kycController.adminApproveAndRelease);


export default router;