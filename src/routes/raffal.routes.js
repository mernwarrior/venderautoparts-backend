import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { createRaffalSchema, updateRaffalSchema, updateRaffalStatusSchema } from "../validations/raffal.validation.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as raffalController from "../controllers/raffal.controller.js"
import { createUploader } from "../utils/uploadMulter.js";
import { validateObjectIdParam } from "../middlewares/validateObjectId.js";
const router = express.Router();


export const uploadRaffleFiles = createUploader("raffles").fields([
  { name: "featureMedia", maxCount: 1 },
  { name: "prizeProfDoc", maxCount: 1 },
  { name: "featureImage", maxCount: 5 },
]);



router.post("/create",  authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadRaffleFiles, validate(createRaffalSchema), raffalController.createRaffal);
router.get("/",  raffalController.getAllRaffal);
router.get("/user", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), raffalController.getRaffalByUser); //getting raffal by user
router.get("/code/:raffleId", raffalController.getRaffalByRaffleId);
router.get("/:id", authMiddleware([ROLE_TYPE.ADMIN]), validateObjectIdParam, raffalController.getRaffalById);
router.patch("/:id",  validateObjectIdParam, authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ADMIN, ROLE_TYPE.ENTRANT]), uploadRaffleFiles, validate(updateRaffalSchema), raffalController.updateRaffal);
router.delete("/:id", validateObjectIdParam, authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ADMIN, ROLE_TYPE.ENTRANT]), uploadRaffleFiles, raffalController.deleteRaffal);
router.patch("/status/:id", validateObjectIdParam, validate(updateRaffalStatusSchema), authMiddleware([ROLE_TYPE.ADMIN]), raffalController.updateRaffalStatus);




export default router;