import express from "express";
import * as withdrawalController from "../controllers/withdrawal.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { validateObjectIdParam } from "../middlewares/validateObjectId.js";
import { withdrawalApproveSchema, withdrawalReqSchema } from "../validations/withdrawal.validation.js";
import { validate } from "../middlewares/validate.middleware.js";
const router = express.Router();

router.post("/", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(withdrawalReqSchema),  withdrawalController.withdrawalRequest);
router.get("/", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]),  withdrawalController.getUserWithdrawals);
router.get("/list", authMiddleware([ ROLE_TYPE.ADMIN]),  withdrawalController.getAdminWithdrawals);
router.get("/:id", authMiddleware([ ROLE_TYPE.ADMIN]),  validateObjectIdParam, withdrawalController.getWithdrawalById);
router.patch("/approve/:id", authMiddleware([ROLE_TYPE.ADMIN]), validate(withdrawalApproveSchema), validateObjectIdParam, withdrawalController.withdrawalApproved);


export default router;

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWQyNGQzYWU0MDM5NjM2ZmIyYWI3MjUiLCJyb2xlIjoiaG9zdCIsImlhdCI6MTc3NTQ1NjU3MywiZXhwIjoxNzc1NDg1MzczfQ.c4s3paraKrIrSXvLxTfPRaArQg16zJ4O1_JaR36vfxg
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWExN2EyZDdkOWIyODM4ZjlhMjgxZmQiLCJyb2xlIjoiaG9zdCIsImlhdCI6MTc3NTQ1MTIyMCwiZXhwIjoxNzc1NDgwMDIwfQ.Kzy3YMyPPl1nUSEBqGQnARX07o1haVoJnz45pU9Vjhg