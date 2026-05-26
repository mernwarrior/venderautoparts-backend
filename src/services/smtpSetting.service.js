import CryptoJS from "crypto-js";
import nodemailer from "nodemailer";
import SmtpSetting from "../models/smtpSetting.model.js";
import { clearSmtpCache, decryptPassword } from "../utils/emailService.js";
import { HTTP_STATUS, RESPONSE_STATUS } from "../utils/constant.js";

const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || "fallback-secret-key";

const encrypt = (text) => CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();

// GET settings (password hidden)
export const getSmtpSettings = async () => {
  try {
    const settings = await SmtpSetting.findOne({ isActive: true }).select("-password");
    return {
      status: RESPONSE_STATUS.SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      data: settings || null,
    };
  } catch (error) {
    console.error(error);
    return { status: RESPONSE_STATUS.ERROR, httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: error.message };
  }
};

// CREATE or UPDATE settings
export const updateSmtpSettings = async (payload, adminId) => {
  try {
    const { host, port, secure, username, password, fromEmail, fromName } = payload;

    const encryptedPassword = encrypt(password);

    const settings = await SmtpSetting.findOneAndUpdate(
      { isActive: true },
      { host, port, secure, username, password: encryptedPassword, fromEmail, fromName, updatedBy: adminId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    clearSmtpCache(); 

    return {
      status: RESPONSE_STATUS.SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      message: "SMTP settings updated successfully",
      data: { ...settings.toObject(), password: "***" },
    };
  } catch (error) {
    console.error(error);
    return { status: RESPONSE_STATUS.ERROR, httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: error.message };
  }
};

// SEND TEST EMAIL
export const testSmtpSettings = async ({ testEmail }) => {
  try {
    const settings = await SmtpSetting.findOne({ isActive: true });

    if (!settings) {
      return {
        status: RESPONSE_STATUS.ERROR,
        httpStatus: HTTP_STATUS.NOT_FOUND,
        message: "No SMTP config found. Please save settings first.",
      };
    }

    const decryptedPass = decryptPassword(settings.password);

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: { user: settings.username, pass: decryptedPass },
    });

    await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: testEmail,
      subject: "✅ SMTP Test - RaffalStar",
      html: `<h2>SMTP is working!</h2><p>Your SMTP configuration is correctly set up on RaffalStar.</p>`,
    });

    return {
      status: RESPONSE_STATUS.SUCCESS,
      httpStatus: HTTP_STATUS.OK,
      message: `Test email sent to ${testEmail}`,
    };
  } catch (error) {
    console.error(error);
    return {
      status: RESPONSE_STATUS.ERROR,
      httpStatus: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: "SMTP test failed: " + error.message,
    };
  }
};