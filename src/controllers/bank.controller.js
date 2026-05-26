import * as bankService from "../services/bank.service.js";
import { HTTP_STATUS } from "../utils/constant.js";

export const createBank = async (req, res) => {
  try {
    const result = await bankService.createBank(req.body, req.user._id, req.files, req);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Create Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const updateBank = async (req, res) => {
  try {
    const result = await bankService.updateBank(req.params.id, req.body, req.files, req);
    return res.status(result.httpStatus).json(result);
  }catch (error) {
    console.error("Update Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const deleteBank = async (req, res) => {
  try {
    const result = await bankService.deleteBank(req.params.id);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Delete Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const getAllBanks = async (req, res) => {
  try {
    const result = await bankService.getAllBanks(req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get Banks Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};
export const getBankByUserId = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await bankService.getBankByUserId(userId);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get Banks Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const getBankById = async (req, res) => {
  try {
    const result = await bankService.getBankById(req.params.id);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get Bank By ID Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const approveBank = async (req, res) => {
  try {
    const result = await bankService.adminApproveBank(req.params.id, req.body);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Approve Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const rejectBank = async (req, res) => {
  try {
    const result = await bankService.rejectBank(req.params.id);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Reject Bank Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};

export const getUserBanks = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await bankService.getUserBanks(userId, req.query);
    return res.status(result.httpStatus).json(result);
  } catch (error) {
    console.error("Get User Banks Error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: error.message || "Something went wrong",
    });
  }
};