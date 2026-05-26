import Joi from "joi";
import { DELIVERY_METHOD, RAFFAL_STATUS } from "../utils/constant.js";
import mongoose from "mongoose";

export const createRaffalSchema = Joi.object({

  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      "string.empty": "Title is required",
    }),

  category: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid category id");
      }
      return value;
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .required(),

  ticketPrice: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "Ticket price must be a number",
    }),

  totalTickets: Joi.number()
    .integer()
    .positive()
    .required(),

  maxTicketsPerUser: Joi.number()
    .integer()
    .positive()
    .required(),

  raffleStartDate: Joi.date()
    .required(),

 raffleEndDate: Joi.date()
    .greater(Joi.ref("raffleStartDate"))
    .required()
    .messages({
      "date.greater": "End date must be greater than start date",
    }),

    drawDate: Joi.date()
  .greater(Joi.ref("raffleEndDate"))
  .required()
  .messages({
    "date.greater": "Draw date must be after raffle end date",
  }),

 charityTag: Joi.string().empty("").optional(), 

  location: Joi.string()
    .trim()
    .required(),

  deliveryMethod: Joi.string()
    .valid(...Object.values(DELIVERY_METHOD))
    .required()
    .messages({
      "any.only": "Invalid delivery method",
    }),

});

export const updateRaffalSchema = Joi.object({

  title: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .optional(),

  category: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid category id");
      }
      return value;
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .optional(),

  ticketPrice: Joi.number()
    .positive()
    .optional()
    .messages({
      "number.base": "Ticket price must be a number",
    }),

  totalTickets: Joi.number()
    .integer()
    .positive()
    .optional(),

  maxTicketsPerUser: Joi.number()
    .integer()
    .positive()
    .optional(),

  raffleStartDate: Joi.date()
    .optional(),

  raffleEndDate: Joi.date()
    .greater(Joi.ref("raffleStartDate"))
    .optional()
    .messages({
      "date.greater": "End date must be greater than start date",
    }),

        drawDate: Joi.date()
  .greater(Joi.ref("raffleEndDate"))
  .optional()
  .messages({
    "date.greater": "Draw date must be after raffle end date",
  }),

  charityTag: Joi.string().empty("").optional(), 


  location: Joi.string()
    .trim()
    .optional(),

  deliveryMethod: Joi.string()
    .valid(...Object.values(DELIVERY_METHOD))
    .optional()
    .messages({
      "any.only": "Invalid delivery method",
    }),

});

export const updateRaffalStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(RAFFAL_STATUS))
    .required()
    .messages({
      "any.only": "Invalid status type",
    }),

  rejectionReason: Joi.string().when("status", {
    is: RAFFAL_STATUS.REJECTED,
    then: Joi.required().messages({
      "any.required": "Rejection reason is required when status is rejected",
    }),
    otherwise: Joi.optional(),
  }),
});