// utils/jwtUtils.js
import jwt from "jsonwebtoken";

import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET } from "../config/const.js";
import { HTTP_STATUS } from "./constant.js";



export const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const generateRefreshToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn });
};


export const verifyToken = (token, secret=JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Token has expired"
        : "Invalid token";
    const error = new Error(message);
    error.httpStatus = HTTP_STATUS.UNAUTHORIZED; // 401
    throw error;
  }
};