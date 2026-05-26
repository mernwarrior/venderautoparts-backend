import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
   image: Joi.string().required().messages({
      "string.empty": "Image is Required",
    }),

});


export const updateCategorySchema = Joi.object({
  name: Joi.string(),
  image: Joi.string().optional().messages({
      "string.empty": "Image is Required",
    }),
 

});