// src/cron/missedDraws.cron.js
import cron from "node-cron";
import Raffle from "../models/raffle.model.js";
import { raffleDrawQueue } from "../queues/raffleDraw.queue.js";

// Har ghante ek baar — sirf missed jobs recover karta hai
export const missedDraws = () => {
cron.schedule("0 * * * *", async () => {
  const missed = await Raffle.find({
    drawDate: { $lte: new Date() },
    drawStatus: "pending",
  }).select("_id").limit(100);

  for (const r of missed) {
    const job = await raffleDrawQueue.getJob(`draw-${r._id}`);
    if (!job) {
      console.warn(`Missed draw re-queuing: ${r._id}`);
      await raffleDrawQueue.add(
        "draw-winner",
        { raffleId: r._id.toString() },
        { jobId: `draw-${r._id}` }
      );
    }
  }
});

   };