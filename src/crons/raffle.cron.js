// cron/raffle.cron.js
import cron from "node-cron";
import Raffle from "../models/raffle.model.js";
import { RAFFAL_STATUS } from "../utils/constant.js";

// Har 5 minute mein run hoga
export const handleExpiredRaffles = () => {
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();

    const result = await Raffle.updateMany(
      {
        status: RAFFAL_STATUS.APPROVE,     // sirf approved raffles
        // raffleEndDate: { $lt: now },       // jinka end date nikal gaya
        drawDate: { $lt: now },       // jinka draw date nikal gaya
      },
      {
        $set: { status: RAFFAL_STATUS.ENDED }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[CRON] ${result.modifiedCount} raffle(s) marked as ended`);
    }

  } catch (error) {
    console.error("[CRON] Raffle end cron failed:", error);
  }
});
};