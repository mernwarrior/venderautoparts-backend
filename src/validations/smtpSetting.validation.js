import Joi from "joi";

export const smtpSettingSchema = Joi.object({
  host:      Joi.string().required(),
  port:      Joi.number().integer().min(1).max(65535).default(587),
  secure:    Joi.boolean().default(false),
  username:  Joi.string().email().required(),
  password:  Joi.string().min(1).required(),
  fromEmail: Joi.string().email().required(),
  fromName:  Joi.string().default("RaffalStar"),
});

export const testSmtpSchema = Joi.object({
  testEmail: Joi.string().email().required(),
});