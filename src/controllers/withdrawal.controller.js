import * as withdrawalService from "../services/withdrawal.service.js";
import { HTTP_STATUS } from "../utils/constant.js";

export const withdrawalRequest = async (req, res) => {
  try {
    const result = await withdrawalService.withdrawalRequest(req.body, req.user._id, req);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};
export const getUserWithdrawals = async (req, res) => {
  try {
        const userId = req.user._id;
    const role = req.user.role;

    const result = await withdrawalService.getUserWithdrawals(userId, req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};
export const getAdminWithdrawals = async (req, res) => {
  try {
        const userId = req.user._id;
    const role = req.user.role;

    const result = await withdrawalService.getAdminWithdrawals(req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const getWithdrawalById = async (req, res) => {
  try {

    const result = await withdrawalService.getWithdrawalById(req.params.id);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const withdrawalApproved = async (req, res) => {
  try {
    const result = await withdrawalService.withdrawalApproved(req.body, req.params.id, req.user._id);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};
