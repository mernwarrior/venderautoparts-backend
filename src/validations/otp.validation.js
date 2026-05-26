import Joi from "joi";
import { ROLE_TYPE } from "../utils/constant.js";


export const resendOtpSchema = Joi.object({
      email: Joi.string().email().required(),
    });

    export const verifyOtpSchema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    });

