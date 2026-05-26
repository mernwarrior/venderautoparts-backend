import express from "express";
import * as smtpController from "../controllers/smtpSetting.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { ROLE_TYPE } from "../utils/constant.js";
import { validate } from "../middlewares/validate.middleware.js";
import { smtpSettingSchema, testSmtpSchema } from "../validations/smtpSetting.validation.js";

const router = express.Router();

router.get("/",      authMiddleware([ROLE_TYPE.ADMIN]), smtpController.getSmtpSettings);
router.post("/",     authMiddleware([ROLE_TYPE.ADMIN]), validate(smtpSettingSchema), smtpController.updateSmtpSettings);
router.post("/test", authMiddleware([ROLE_TYPE.ADMIN]), validate(testSmtpSchema),    smtpController.testSmtpSettings);

export default router;