import express from "express";
import * as orderController from "../controllers/order.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { buyTicketSchema } from "../validations/order.validation.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();


router.get("/", authMiddleware([ROLE_TYPE.ADMIN]), orderController.getAllOrders);
router.post("/buy-ticket", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(buyTicketSchema), orderController.buyTickets);
router.post("/capture-payment", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), orderController.capturePayment);


export default router;