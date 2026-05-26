import Joi from "joi";
import { DRAW_STATUS } from "../utils/constant.js";

export const uploadDocSchema = Joi.object({
  document: Joi.string().required()

});

export const kycApprovalSchema = Joi.object({
  status: Joi.string()
    .valid(DRAW_STATUS.KYC_APPROVED, DRAW_STATUS.KYC_FAILED)
    .required()
});

export const adminReviewSchema = Joi.object({
  action: Joi.string()
    .valid("approved", "rejected")
    .required(),
  adminNote: Joi.string().allow("").optional(),
});


export const messageSchema = Joi.object({
    message: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      "string.empty": "message is required",
      "string.min": "message cannot be empty",
    }),

})