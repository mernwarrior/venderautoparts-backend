
  export const HTTP_STATUS = {
    OK: 200,
    SUCCESS: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
  };
  
  export const RESPONSE_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
  };

    export const ROLE_TYPE= {
    ADMIN: "admin",
    HOST: "host",
    ENTRANT: "entrant",

  }

    export const GENDER_TYPE= {
    MALE: "male",
    FEMALE: "female",
    OTHER: "other",

  }

  
  export const DEVICE_TYPE = {
    ANDROID: 1,
    IOS: 2,
    WEB: 3,
  }

export const USER_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  BLOCKED: "blocked",
  PENDING: "pending",
  BANNED: "banned",
});
export const TICKET_STATUS = Object.freeze({
  PENDING: "pending",
  DRAWN: "drawn",
  WINNER: "winner",

});
export const BANK_STATUS = Object.freeze({
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",

});

export const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",

});


export const DRAW_STATUS = Object.freeze({
  PENDING: "pending",               // draw honi baki
  DRAWN: "drawn",                  // winner select hua
  KYC_PENDING: "kyc_pending",      // winner se ID maangi
  KYC_FAILED: "kyc_failed",        // KYC nahi aayi — redraw hoga
  KYC_SUBMITTED: "kyc_submitted",    // winner ne KYC submit kar di
  KYC_APPROVED: "kyc_approved",        // KYC nahi aayi — redraw hoga
  PRIZE_IN_DELIVERY: "prize_in_delivery", // host ne proof upload kiya
  PROOF_SUBMITTED: "proof_submitted",     // winner ne bhi proof upload kiya
  COMPLETED: "completed",          // admin approve → escrow release
  CANCELLED: "cancelled",          // raffle cancel
});

export const SUPPORT_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  CLOSED: "closed",

});
export const SUPPORT_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",

});

export const DEFAULT_SETTINGS = {
  OTP_EXPIRY_MINUTES: 5,
  PLATFORM_FEES:5,
  KYC_DEAD_LINE:7
}



export const RAFFAL_STATUS = Object.freeze({
  APPROVE: "approved",
  PENDING: "pending",
  REJECTED: "rejected",
  ENDED: "ended",
  COMPLETED: "completed",
});

export const DELIVERY_METHOD = Object.freeze({
  COURIER: "courier",
  PICKUP: "pickup",
});


export const TRANSACTION_TYPE = Object.freeze({
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  TICKET_PURCHASE: "ticket_purchase",
  RAFFLE_REWARD: "raffle_reward",

});

export const TRANSACTION_STATUS = Object.freeze({
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",

});
export const PAYMENT_METHOD = Object.freeze({
  STRIPE: "stripe",
  PAYFAST: "payfast",
  PAYSTACK: "paystack",
  INTERNAL: "internal",

});