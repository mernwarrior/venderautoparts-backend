import express from "express";
import * as supportController from "../controllers/support.controller.js";
import { createUploader } from "../utils/uploadMulter.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { messageSchema, supportSchema } from "../validations/support.validation.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { validateObjectIdParam } from "../middlewares/validateObjectId.js";

const router = express.Router();


export const uploadSupport = createUploader("support").fields([
  { name: "screenshot", maxCount: 1 },

]);

router.post("/", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadSupport, validate(supportSchema), supportController.createTicket);
router.get("/", authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), supportController.getTickets);
router.get("/:id/messages", validateObjectIdParam, authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), supportController.getMessages);
router.post("/:id/message", authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(messageSchema), supportController.sendMessage);
router.patch("/:id/close", authMiddleware([ROLE_TYPE.ADMIN]), supportController.closeTicket);

export default router;