import { NODE_ENV } from "../config/const.js";
import * as userService from "../services/user.service.js";
import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";
import { RESPONSE_MESSAGES } from "../utils/response.js";


export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });

  } catch (error) {
    next(error); // send to error middleware
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    let accessToken = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }

    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    await userService.logoutUser({ accessToken, refreshToken });

    // ✅ clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });

  } catch (error) {
    next(error);
  }
};


export const getAllUsers = async (req, res, next) => {
  try {
     const userId = req.user.userId; 

    const result = await userService.getAllUsers(userId, req.query);

    return res.status(result.httpStatus).json({
      success: true,
      message:result.message,
      data: result.data,
      totalCount: result.totalCount,
      currentCount: result.currentCount,

    });

  } catch (error) {
    next(error);
  }
};


export const getUser = async (req, res, next) => {
  try {
    const result = await userService.getUserById(req.params.id);

    return res.status(result.httpStatus).json({
      success: true,
      message:result.message,
      data: result.data,

    });

  } catch (error) {
    next(error);
  }
};

export const getAdminDash = async (req, res) => {
  try {

    const result = await userService.getAdminDashStats();
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};



export const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: RESPONSE_STATUS.ERROR,
        message: "username must be provided",
        httpStatus: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Call service
    const result = await userService.getUserProfile(username);

    return res.status(result.httpStatus).json({
      success: result.status === RESPONSE_STATUS.SUCCESS,
      message: result.message,
      data: result.data || null,
    });

  } catch (error) {
    console.error("getUserProfile endpoint error:", error);
    next(error); // Forward to Express error handler
  }
};

export const updateUser = async (req, res, next) => {
  try {

     const userId = req.user._id; 

    const result = await userService.updateUser(userId, req.files, req.body, req);

        res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status
      });



  } catch (error) {
    next(error);
  }
};

export const checkUsername = async (req, res, next) => {
  try {
    const userId = req.user._id; // token se user id
    const { username } = req.query; // query se username

    if (!username) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: RESPONSE_STATUS.ERROR,
        message: "Username is required",
      });
    }

    // Service call – updateUser ko text-only update ke liye use kar sakte ho
    const result = await userService.checkUsername(userId, username);

    res.status(result.httpStatus).json({
      status: result.status,
      message: result.message,
    });

  } catch (error) {
    next(error);
  }
};

export const checkUsernameExist = async (req, res, next) => {
  try {
    const userId = req.user._id; // token se user id

    const result = await userService.checkUsernameExist(userId);

    res.status(result.httpStatus).json({
      status: result.status,
      message: result.message,
      data:result.data
    });

  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.id; 
    const admin = req.user; 

  if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: RESPONSE_STATUS.ERROR,
        message: "UserId is required!",
      });
    }

    const result = await userService.updateUserStatus(userId, admin, req.body);

    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
        data:result.data
      });

  } catch (error) {
    next(error); // send to error middleware
  }
};


export const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};
export const getUserNotification = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware

    const result = await userService.getNotifications(userId, req.query);

    res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        data:result.data,
        totalCount: result.totalCount,
      currentCount: result.currentCount,
      unreadCount: result.unreadCount,
      });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};


export const requestEmailChange = async (req, res, next) => {
  try {
    const result = await userService.requestEmailChange(req.user._id, req.body);

    res.status(result.httpStatus).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmailChangeOTP = async (req, res, next) => {
  try {
    const result = await userService.verifyEmailChangeOTP(req.user._id, req.body, req);

    res.status(result.httpStatus).json(result);
  } catch (error) {
    next(error);
  }
};

export const requestPasswordChange = async (req, res, next) => {
  try {
    const result = await userService.requestPasswordChange(req.user._id, req.body);
    res.status(result.httpStatus).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyPasswordChangeOTP = async (req, res, next) => {
  try {
    const result = await userService.verifyPasswordChangeOTP(req.user._id, req.body, req);
    res.status(result.httpStatus).json(result);
  } catch (error) {
    next(error);
  }
};


export const requestPhoneChange = async (req, res, next) => {
  try {
    const result = await userService.requestPhoneChange(req.user._id, req.body);
    res.status(result.httpStatus).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyPhoneChangeOTP = async (req, res, next) => {
  try {
    const result = await userService.verifyPhoneChangeOTP(req.user._id, req.body, req);
    res.status(result.httpStatus).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllWinners = async (req, res, next) => {
    try {

        //    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Invalid ticket ID"
        //     });
        // }

          const result = await userService.getAllWinners(req.query);
          return res.status(result.httpStatus).json(result);

        
    } catch (error) {
         next(error);
        
    }
};

export const getAllWinnersByHost = async (req, res, next) => {
    try {

          const result = await userService.getAllWinnersByHost(req.user._id, req.query);
          return res.status(result.httpStatus).json(result);

        
    } catch (error) {
         next(error);
        
    }
};
