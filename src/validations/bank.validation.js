import Joi from "joi";
import { BANK_STATUS } from "../utils/constant.js";

export const bankCreateSchema = Joi.object({
  bankName: Joi.string().required().messages({
    "string.empty": "Bank name is required",
  }),
  bankHolderName: Joi.string().required().messages({
    "string.empty": "Bank holder name is required",
  }),
  accountNo: Joi.string().pattern(/^\d{9,18}$/).required().messages({
    "string.empty": "Account number is required",
    "string.pattern.base": "Account number must be 9-18 digits",
  }),
  ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
    "string.empty": "IFSC code is required",
    "string.pattern.base": "Invalid IFSC code format",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required",
  }),
  frontPhoto: Joi.string().required().messages({
    "string.empty": "Front photo is required",
  }),
  backPhoto: Joi.string().required().messages({
    "string.empty": "Back photo is required",
  }),
});

export const bankUpdateSchema = Joi.object({
  bankName: Joi.string().optional().messages({
    "string.empty": "Bank name cannot be empty",
  }),
  bankHolderName: Joi.string().optional().messages({
    "string.empty": "Bank holder name cannot be empty",
  }),
  accountNo: Joi.string()
    .pattern(/^\d{9,18}$/)
    .optional()
    .messages({
      "string.pattern.base": "Account number must be 9-18 digits",
      "string.empty": "Account number cannot be empty",
    }),
  ifscCode: Joi.string()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid IFSC code format",
      "string.empty": "IFSC code cannot be empty",
    }),
  state: Joi.string().optional().messages({
    "string.empty": "State cannot be empty",
  }),
  frontPhoto: Joi.string().optional().messages({
    "string.empty": "Front photo cannot be empty",
  }),
  backPhoto: Joi.string().optional().messages({
    "string.empty": "Back photo cannot be empty",
  }),
});

export const approveBankSchema = Joi.object({
  status: Joi.string().valid(BANK_STATUS.VERIFIED, BANK_STATUS.REJECTED).required().messages({
    "any.only": "Status must be either 'verified' or 'rejected'",
    "string.empty": "Status is required",
  }),
  rejectionReason: Joi.string().when("status", {
    is: BANK_STATUS.REJECTED,
    then: Joi.string().required().messages({
      "string.empty": "Rejection reason is required when status is rejected",
    }),
    otherwise: Joi.string().optional(),
  }),
});
