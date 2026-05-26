import rateLimit from "express-rate-limit";

const createLimiter = (windowMinutes, max, message) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });
};

// ✅ Saare limiters ek jagah
export const globalLimiter = createLimiter(
  15, 100, "Too many requests, try again after 15 minutes."
);

export const loginLimiter = createLimiter(
  15, 5, "Too many login attempts, try again after 15 minutes."
);

export const registerLimiter = createLimiter(
  60, 3, "Too many registrations, try again after 1 hour."
);

export const otpSendLimiter = createLimiter(
  10, 3, "Too many OTP requests, try again after 10 minutes."
);

export const passwordResetLimiter = createLimiter(
  30, 5, "Too many password reset attempts, try again after 30 minutes."
);