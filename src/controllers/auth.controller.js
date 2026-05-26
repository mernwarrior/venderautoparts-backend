import * as userService from "../services/user.service.js";
import * as authService from "../services/auth.service.js"
import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";
import { NODE_ENV } from "../config/const.js";

export const createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.body);

    res.status(result.httpStatus).json({
        message: result.message || RESPONSE_MESSAGES.SUCCESS,
        status: result.status || RESPONSE_STATUS.SUCCESS,
        code: result.code
        // token: result.token || null, 
      });




  } catch (error) {
    next(error); // send to error middleware
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const result = await userService.loginUser(req.body, req);

    // ❌ agar error hai to cookie set nahi karni
    if (result.status !== RESPONSE_STATUS.SUCCESS) {
      return res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
      });
    }

    const { accessToken, refreshToken, role } = result.data;

    // ✅ Refresh Token → Cookie me set
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production", // prod me true
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // domain: "192.168.1.55",
    });

    // ✅ Response me sirf accessToken bhejo
    return res.status(result.httpStatus).json({
      message: result.message,
      status: result.status,
      data: {
        accessToken,
      },
    });

  } catch (error) {
    next(error);
  }
};


export const refreshToken = async (req, res, next) => {
  try {
    // console.log('refreshToken', req)
    const refreshToken = req.cookies?.refreshToken;
       if (!refreshToken) {
      return {
        status: RESPONSE_STATUS.ERROR,
        message: "Refresh token not found",
        httpStatus: HTTP_STATUS.UNAUTHORIZED,
      };
    }
        const result = await authService.refreshTokenService(refreshToken);


    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
        data: result.data || null, 
      });

  } catch (error) {
    next(error); 
  }
};


export const adminLogin = async (req, res, next) => {
  try {
    const result = await authService.adminLoginService(req.body);

    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
        token: result.token,
        data:result.data
      });

  } catch (error) {
    next(error); // send to error middleware
  }
};

export const setup2FA = async (req, res, next) => {
  try {
    const userId = req.user.userId
    console.log(req.user,'user')
    
    const result = await authService.setup2FAService(userId, req.body);

    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
        data:result.data
      });

  } catch (error) {
    next(error); // send to error middleware
  }
};


export const getProfile = async (req, res, next) => {
  try {
    // console.log('getProfile', req.user)

    const userId = req.user.userId || req.user._id
    const result = await authService.getProfileService(userId);

    res.status(result.httpStatus).json({
        message: result.message,
        status: result.status,
        user:result.user
      });

  } catch (error) {
    next(error); // send to error middleware
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const response = await authService.forgotPassword(req.body);

    return res.status(response.httpStatus).json({
      status: response.status,
      message: response.message,
    });
  } catch (error) {
    next(error);
  }
};

export const adminForgotPassword = async (req, res, next) => {
  try {
    const response = await authService.adminForgotPassword(req.body);

    return res.status(response.httpStatus).json({
      status: response.status,
      message: response.message,
    });
  } catch (error) {
    next(error);
  }
};

export const adminResetPassword = async (req, res, next) => {
  try {
    const response = await authService.adminResetPassword(req.body);
console.log(response,'response')
    return res.status(response.httpStatus).json({
      status: response.status,
      message: response.message,
    });
  } catch (error) {
    next(error);
  }
};

export const changeAdminPassword = async (req, res, next) => {
  try {
    const response = await authService.changeAdminPassword(req.body, req.user._id);
console.log(response,'response')
    return res.status(response.httpStatus).json({
      status: response.status,
      message: response.message,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const response = await authService.resetPasswordService(req.body);

    return res.status(response.httpStatus).json({
      status: response.status,
      message: response.message,
    });
  } catch (error) {
    next(error);
  }
};


export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      data: users,
    });

  } catch (error) {
    next(error);
  }
};


export const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    next(error);
  }
};


export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });

  } catch (error) {
    next(error);
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


export const getAllUserAudits = async (req, res) => {
  try {
        const { userId } = req.query;


    const result = await authService.getAudits(userId, req.query);

        res.status(result.httpStatus).json({
        message: result.message ,
        status: result.status,
        data:result.data,
        totalCount: result.totalCount,
      currentCount: result.currentCount,
      });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};
