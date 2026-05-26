import Joi from "joi";
import { BANK_STATUS, WITHDRAWAL_STATUS } from "../utils/constant.js";

export const withdrawalReqSchema = Joi.object({
    amount: Joi.number().required()
})

export const withdrawalApproveSchema = Joi.object({
     status: Joi.string().valid(WITHDRAWAL_STATUS.APPROVED, WITHDRAWAL_STATUS.REJECTED).required().messages({
        "any.only": "Status must be either 'approved' or 'rejected'",
        "string.empty": "Status is required",
      }),
      rejectionReason: Joi.string().when("status", {
        is: WITHDRAWAL_STATUS.REJECTED,
        then: Joi.string().required().messages({
          "string.empty": "Rejection reason is required when status is rejected",
        }),
        otherwise: Joi.string().optional(),
      }),
})