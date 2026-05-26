import Joi from "joi";

export const supportSchema = Joi.object({
  category: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      "string.empty": "category is required",
      "string.min": "category cannot be empty",
    }),

  subCategory: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      "string.empty": "sub-category is required",
      "string.min": "sub-category cannot be empty",
    }),

  message: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      "string.empty": "message is required",
      "string.min": "message cannot be empty",
    }),
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