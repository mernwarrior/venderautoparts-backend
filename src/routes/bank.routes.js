import express from "express";

import * as bankController from "../controllers/bank.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createUploader } from "../utils/uploadMulter.js";
import { validateObjectIdParam } from "../middlewares/validateObjectId.js";
import { approveBankSchema, bankCreateSchema, bankUpdateSchema } from "../validations/bank.validation.js";

const router = express.Router();

export const uploadbankDocs = createUploader("banks").fields([
  { name: "frontPhoto", maxCount: 1 },
  { name: "backPhoto", maxCount: 1 }

]);

router.post("/", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadbankDocs, validate(bankCreateSchema),  bankController.createBank);
router.patch("/:id", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validateObjectIdParam , uploadbankDocs, validate(bankUpdateSchema), bankController.updateBank);
router.patch("/approve/:id", authMiddleware([ROLE_TYPE.ADMIN]), validateObjectIdParam , validate(approveBankSchema), bankController.approveBank);
router.delete("/:id", validateObjectIdParam, authMiddleware([ROLE_TYPE.ADMIN]), bankController.deleteBank);
router.get("/", authMiddleware([ROLE_TYPE.ADMIN]), bankController.getAllBanks);
router.get("/user", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), bankController.getBankByUserId);
router.get("/:id", authMiddleware([ROLE_TYPE.ADMIN]), validateObjectIdParam, bankController.getBankById);

export default router;