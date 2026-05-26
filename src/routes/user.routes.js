import express from "express";
import * as userController from "../controllers/user.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, selfEmailSchema, selfPasswordSchema, selfPhoneSchema, userStatusSchema, verifyUserOtpSchema } from "../validations/user.validation.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";
import { createUploader } from "../utils/uploadMulter.js";

const router = express.Router();

const uploadProfileImages = createUploader("profile").fields([
  { name: "avatar", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

router.post("/", validate(registerSchema), userController.createUser);
// router.get("/", authMiddleware, userController.getAllUsers);
router.post("/logout", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT,  ROLE_TYPE.ADMIN]), userController.logoutUser);


router.get("/profile", userController.getUserProfile);
router.get("/winner", userController.getAllWinners);
router.get("/winner-list", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), userController.getAllWinnersByHost);

// router.put("/profile", authMiddleware, userController.updateUser);
router.patch("/profile", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadProfileImages, userController.updateUser);
router.get("/username/check", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), userController.checkUsername);
router.get("/username/exist", authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), userController.checkUsernameExist);
router.get("/notifications", authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), userController.getUserNotification);

router.patch("/self/email/request",  authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), uploadProfileImages, validate(selfEmailSchema), userController.requestEmailChange);
router.patch("/self/email/verify",  authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(verifyUserOtpSchema), userController.verifyEmailChangeOTP);

router.patch("/self/password/request",   authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(selfPasswordSchema),userController.requestPasswordChange);
router.patch("/self/password/verify",   authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(verifyUserOtpSchema), userController.verifyPasswordChangeOTP);

router.patch("/self/phone/request",  authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(selfPhoneSchema),  userController.requestPhoneChange);
router.patch("/self/phone/verify",  authMiddleware([ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), validate(verifyUserOtpSchema), userController.verifyPhoneChangeOTP);


// For Admin
router.patch("/status/:id",  authMiddleware([ROLE_TYPE.ADMIN]), validate(userStatusSchema), userController.updateUserStatus);
router.get("/", authMiddleware([ROLE_TYPE.ADMIN]), userController.getAllUsers);
router.get("/dash-stats", authMiddleware([ROLE_TYPE.ADMIN]), userController.getAdminDash);
router.get("/:id", authMiddleware([ROLE_TYPE.ADMIN]), userController.getUser);



router.delete("/:id", authMiddleware, userController.deleteUser);

export default router;
