const RESPONSE_MESSAGES = {
    ALREADY_EXISTS: (message) => `${message} is already exists!`,
    CREATED:(message) => `${message} created successfully!`,
    UPDATED:(message) => `${message} updated successfully!`,
    RETRIEVE:(message) => `${message} retrieve successfully!`,
    DELETED:(message) => `${message} deleted successfully!`,
    NOT_FOUND:(message) => `${message} not found!`,
    UNAVAILABLE:(message) => `${message} you are trying to buy is currently unavailable!`,
    LOGIN_SUCCESS: `Logged in successfully!`,
    INVALID_CREDENTIALS: `Invalid email or password!`,
    UNAUTHORIZED: `You are not authorized to access this resource!`,
    EMAIL_VERIFICATION: `A verification email has been sent! Please check your inbox to verify your email address.`,
    VERIFIED_ACCOUNT: 'Account has already been verified',
    INVALID_OTP: 'Invalid otp',
    INVALID_OTP_ID: 'Invalid otp ID',
    OTP_SENT: 'OTP sent to your email successfully',
    OTP_EXPIRED: 'Otp has been expired!',
    SOMETHING_WENT_WRONG: 'Something went wrong! Please try again later.',
    NOT_VERIFIED_ACCOUNT: 'Account is not verified yet!, Please verify your email before logging in.',
    PASSWORD_CHANGED:"Password changed successfully!",
    RESET_LINK:"A password reset link has been sent to your email address. Please check your inbox and spam folder.",
    RESET_LINK_EXPIRED:"Your password reset link has expired. Please request a new link to reset your password.",
}

 export {
    RESPONSE_MESSAGES
  };