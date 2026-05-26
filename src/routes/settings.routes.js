import express from "express";
import * as settingController from "../controllers/settings.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { createUploader } from "../utils/uploadMulter.js";
import { featureValidation, updateAboutSchema, updateEntrantSchema, updateFaqSchema, updateGeneralSettingsSchema, updatePricingValidation, updatePrivacySchema, updateSettingsSchema, updateTermsSchema } from "../validations/settings.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();
const uploadProfileImages = createUploader("home").fields([
  { name: "bgImage", maxCount: 1 },
  ...Array.from({ length: 20 }, (_, i) => ({ name: `toolsIcon_${i}`, maxCount: 1 }))
]);

const uploadGeneralImages = createUploader("general").fields([
  { name: "logo", maxCount: 1 },
  { name: "flag", maxCount: 1 },

  ...Array.from({ length: 20 }, (_, i) => ({
    name: `socialIcon_${i}`,
    maxCount: 1,
  })),
]);

router.get("/host", settingController.getSettings);
router.patch("/host/:id", authMiddleware([ROLE_TYPE.ADMIN]), uploadProfileImages,validate(updateSettingsSchema), settingController.updateSettings);

router.get("/entrant", settingController.getEntrantSettings);
router.patch("/entrant/:id", authMiddleware([ROLE_TYPE.ADMIN]), uploadProfileImages,validate(updateEntrantSchema), settingController.updateEntrantSettings);

router.get("/about", settingController.getAbout);
router.patch("/about/:id", authMiddleware([ROLE_TYPE.ADMIN]),validate(updateAboutSchema), settingController.updateAbout);

router.get("/faq", settingController.getFaqSettings);
router.patch("/faq/:id", authMiddleware([ROLE_TYPE.ADMIN]),validate(updateFaqSchema), settingController.updateFaqSettings);

router.get("/feature", settingController.getFeatures);
router.patch("/feature/:id", authMiddleware([ROLE_TYPE.ADMIN]),validate(featureValidation), settingController.updateFeatures);

router.get("/price", settingController.getPricing);
router.patch("/price/:id", authMiddleware([ROLE_TYPE.ADMIN]),validate(updatePricingValidation), settingController.updatePricing);

router.get("/general", settingController.getGeneralSettings);
router.patch("/general/:id", authMiddleware([ROLE_TYPE.ADMIN]), uploadGeneralImages,validate(updateGeneralSettingsSchema), settingController.updateGeneralSettings);

router.get("/terms", settingController.getTerms);
router.patch("/terms/:id", authMiddleware([ROLE_TYPE.ADMIN]),validate(updateTermsSchema), settingController.updateTerms);

router.get("/privacy", settingController.getPrivacy);
router.patch("/privacy/:id", authMiddleware([ROLE_TYPE.ADMIN]),validate(updatePrivacySchema), settingController.updatePrivacy);

export default router;
