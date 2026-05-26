import Joi from "joi";
import { ROLE_TYPE, USER_STATUS } from "../utils/constant.js";


export const registerSchema = Joi.object({

  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().required(),

  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]{6,}$'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 1 number and 1 special character',
      'string.min': 'Password must be at least 6 characters long'
    }),

  role: Joi.string()
    .valid(ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT)
    .required(),

  // ✅ Now always optional (no role check)
  countryCode: Joi.string().optional(),
phoneNo: Joi.string()
  
  .optional(),
    description: Joi.string().optional(),

});

// phoneNo: Joi.string()
//   .pattern(/^[0-9]{10}$/)
//   .optional(),
//     description: Joi.string().optional(),

// });

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  pattern: Joi.string().min(6).required(),
  totp: Joi.number().min(6).required(),
  rememberMe: Joi.boolean(),

});


export const adminChangePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
  pattern: Joi.string().min(6).required(),

});

export const setup2FASchema = Joi.object({
  enable: Joi.boolean().required(),

});


export const userStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(USER_STATUS)),
  isDeleted: Joi.boolean()
});


export const selfEmailSchema = Joi.object({

  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const selfPhoneSchema = Joi.object({


  phoneNo: Joi.string().required()
  

});
export const selfPasswordSchema = Joi.object({
  currentPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
});


export const forgetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
  
});

export const verifyUserOtpSchema = Joi.object({
      otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    });
