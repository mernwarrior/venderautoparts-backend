// import nodemailer from "nodemailer";
// import { AWS_SES_SMTP_HOST, AWS_SES_SMTP_USERNAME, AWS_SES_SMTP_PASSWORD, EMAIL_FROM } from "../config/const.js";

// Create SMTP transporter
// const transporter = nodemailer.createTransport({
//   host: AWS_SES_SMTP_HOST,
//   port: 465,
//   secure: true,
//   auth: {
//     user: AWS_SES_SMTP_USERNAME,
//     pass: AWS_SES_SMTP_PASSWORD,
//   },
//   //  logger: true,
//   // debug: true,
// });

// export const sendEmail = async (to, subject, templateName) => {
//   try {
//     const info = await transporter.sendMail({
//       from: EMAIL_FROM,
//       to,
//       subject,
//       html: templateName,
//     });

//     console.log("Email sent: ", info.messageId);
//     return info;
//   } catch (err) {
//     console.error("Email send error: ", err);
//     throw err;
//   }
// };




import nodemailer from "nodemailer";
import CryptoJS from "crypto-js";
import SmtpSetting from "../models/smtpSetting.model.js";
import { SMTP_ENCRYPTION_KEY } from "../config/const.js";
import { AWS_SES_SMTP_HOST, AWS_SES_SMTP_USERNAME, AWS_SES_SMTP_PASSWORD, EMAIL_FROM } from "../config/const.js";

export const encryptPassword = (text) =>
  CryptoJS.AES.encrypt(text, SMTP_ENCRYPTION_KEY).toString();

export const decryptPassword = (cipher) =>
  CryptoJS.AES.decrypt(cipher, SMTP_ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);


const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _cache = { transporter: null, fromEmail: null, fromName: null, timestamp: null };

export const clearSmtpCache = () => {
  _cache = { transporter: null, fromEmail: null, fromName: null, timestamp: null };
};

const isCacheValid = () =>
  _cache.transporter && _cache.timestamp && Date.now() - _cache.timestamp < CACHE_TTL;

const buildTransporter = (host, port, secure, user, pass) =>
  nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

const getTransporter = async () => {
  if (isCacheValid()) return _cache;

  const settings = await SmtpSetting.findOne({ isActive: true });

  if (settings) {
    _cache = {
      transporter: buildTransporter(
        settings.host, settings.port, settings.secure,
        settings.username, decryptPassword(settings.password)
      ),
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      timestamp: Date.now(),
    };
  } else {
    // Fallback to AWS SES
    // const { AWS_SES_SMTP_HOST, AWS_SES_SMTP_USERNAME, AWS_SES_SMTP_PASSWORD, EMAIL_FROM } =
    //   await import("../config/const.js");

    _cache = {
      transporter: buildTransporter(AWS_SES_SMTP_HOST, 465, true, AWS_SES_SMTP_USERNAME, AWS_SES_SMTP_PASSWORD),
      fromEmail: EMAIL_FROM,
      fromName: "RaffalStar",
      timestamp: Date.now(),
    };
  }

  return _cache;
};

// ─── Send Email ───────────────────────────────────────────────────────────────

export const sendEmail = async (to, subject, html) => {
  try {
    const { transporter, fromEmail, fromName } = await getTransporter();

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
}; 