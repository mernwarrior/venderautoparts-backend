import Joi from "joi";
import mongoose from "mongoose";

export const buyTicketSchema = Joi.object({
  raffleId: Joi.string()
    .required()
        .custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message("Invalid raffle id");
          }
          return value;
        }),

  ticketQuantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Ticket quantity must be a number",
      "number.min": "At least 1 ticket is required",
    }),

  paymentMethod: Joi.string()
    .valid("stripe", "payfast", "paystack")
    .required()
    .messages({
      "any.only": "Please Select Payment Method",
    }),

//   answer: Joi.string()
//     .allow("", null)
//     .optional(),

  promoCode: Joi.string()
    .trim()
    .uppercase()
    .optional(),
});
