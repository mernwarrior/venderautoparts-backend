import express from "express";
import * as ticketController from "../controllers/ticket.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { buyTicketSchema } from "../validations/order.validation.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();


router.get("/", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ADMIN, ROLE_TYPE.ENTRANT]), ticketController.getAllTickets);
router.get("/stats", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), ticketController.getTicketsStats);
router.get("/all", authMiddleware([ROLE_TYPE.ADMIN]), ticketController.getAllTicketsByAdmin);

export default router;