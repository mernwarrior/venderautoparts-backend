import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema, adminLoginSchema, forgetPasswordSchema, resetPasswordSchema, setup2FASchema, adminChangePasswordSchema } from "../validations/user.validation.js";
import { FRONTEND_APP_URL, NODE_ENV } from "../config/const.js";
import passport from "passport";
import { generateRefreshToken, generateToken } from "../utils/jwtUtils.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ROLE_TYPE } from "../utils/constant.js";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.createUser);
router.post("/login", validate(loginSchema), authController.loginUser);
router.post("/refresh-token",  authController.refreshToken);


router.post("/forget", validate(forgetPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);


// Admin Routes
router.post("/admin-login", validate(adminLoginSchema), authController.adminLogin);
router.post("/setup2fa", validate(setup2FASchema), authMiddleware([ROLE_TYPE.ADMIN]), authController.setup2FA);
router.get('/me', authMiddleware([ROLE_TYPE.ADMIN, ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT]), authController.getProfile)
router.post('/forgotpassword', authController.adminForgotPassword);
router.post('/resetpassword', authController.adminResetPassword);
router.post('/changepassword', authMiddleware([ROLE_TYPE.ADMIN]), validate(adminChangePasswordSchema), authController.changeAdminPassword);




// 🔵 Google Login
// router.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"], session: false})
// );

router.get(
  "/google",
  (req, res, next) => {
    const role = req.query.role;

    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state: role   // 👈 role yaha store ho raha hai
    })(req, res, next);
  }
);

router.get("/admin/audits", authMiddleware([ROLE_TYPE.ADMIN]), authController.getAllUserAudits);

// Backend alternative (more secure)
router.get(
  "/google/callback",
   (req, res, next) => {
    if (!req.query.code) {
      console.log("No code found, skipping...");
      return res.redirect("/login");
    }
    next();
  },
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const tokenPayload = {
      userId: req.user._id,
      role: req.user.role,
    };
    
    const accessToken = generateToken(tokenPayload);
    
    res.cookie("accessToken", accessToken, {
      httpOnly: false,  // false so js-cookie can also read it if needed
    secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    
    // Redirect without token in URL
    const redirectUrl = `${process.env.FRONTEND_APP_URL}/social-success?type=${req.user.role}&token=${accessToken}`;
    res.redirect(redirectUrl);
  }
);

// 🔵 Facebook Login
// router.get(
//   "/facebook",
//   passport.authenticate("facebook", { scope: ["email"] })
// );

// router.get(
//   "/facebook/callback",
//   passport.authenticate("facebook", { failureRedirect: "/login" }),
//   (req, res) => {
//     const token = generateToken({ userId: req.user._id });

//     res.redirect(
//       `${FRONTEND_APP_URL}/social-success?token=${token}`
//     );
//   }
// );




export default router;
