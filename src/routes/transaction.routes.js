import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
const router = express.Router();


router.get("/", authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), transactionController.getAllTransaction);



export default router;