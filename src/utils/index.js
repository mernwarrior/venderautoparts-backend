import * as bcrypt from 'bcrypt';
import fs from "fs";
import path from "path";
import Counter from "../models/counter.model.js";
import { HTTP_STATUS, RESPONSE_STATUS } from './constant.js';

export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


export async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
  
  export async function comparePasswords(plainTextPassword, hashedPassword) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }

  export function addMinutesInDate(minutes) {
  return new Date(new Date().getTime() + minutes * 60000);
}

export const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

const getNextSequence = async (key, session) => {
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, session } // upsert = create if not exists
  );
  return counter.seq;
};

export async function generateOrderNumber(session) {
  const seq = await getNextSequence("order", session);
  return `ORD-${String(seq).padStart(6, "0")}`;
}

export async function generateTicketNumber(session) {
  const seq = await getNextSequence("ticket", session);
  return `TKT-${String(seq).padStart(6, "0")}`;
}

export const errorResponse = (message, httpStatus = HTTP_STATUS.BAD_REQUEST) => ({
    status: RESPONSE_STATUS.ERROR,
    message,
    httpStatus,
});

export const resolveDateRange = (date, startDate, endDate) => {
  if (!date) return null;

  const now = new Date();

  const startOfDay = (d) => { d.setHours(0, 0, 0, 0); return d; };
  const endOfDay   = (d) => { d.setHours(23, 59, 59, 999); return d; };

  switch (date) {
    case "today":
      return {
        $gte: startOfDay(new Date()),
        $lte: endOfDay(new Date()),
      };

    case "1week":
      return {
        $gte: new Date(now.setDate(now.getDate() - 7)),
        $lte: new Date(),
      };

    case "1month":
      return {
        $gte: new Date(now.setMonth(now.getMonth() - 1)),
        $lte: new Date(),
      };

    case "2month":
      return {
        $gte: new Date(now.setMonth(now.getMonth() - 2)),
        $lte: new Date(),
      };

    case "3month":
      return {
        $gte: new Date(now.setMonth(now.getMonth() - 3)),
        $lte: new Date(),
      };

    case "custom":
      if (!startDate || !endDate) return null;
      return {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate)),
      };

    default:
      return null;
  }
};


