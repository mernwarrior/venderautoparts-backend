import * as smtpService from "../services/smtpSetting.service.js";

export const getSmtpSettings = async (req, res, next) => {
  try {
    const result = await smtpService.getSmtpSettings();
    res.status(result.httpStatus).json({ status: result.status, data: result.data });
  } catch (error) { next(error); }
};

export const updateSmtpSettings = async (req, res, next) => {
  try {
    const result = await smtpService.updateSmtpSettings(req.body, req.user._id);
    res.status(result.httpStatus).json({ status: result.status, message: result.message, data: result.data });
  } catch (error) { next(error); }
};

export const testSmtpSettings = async (req, res, next) => {
  try {
    const result = await smtpService.testSmtpSettings(req.body);
    res.status(result.httpStatus || 200).json({ 
      status: result.status, 
      message: result.message 
    });
  } catch (error) { 
    next(error); 
  }
};