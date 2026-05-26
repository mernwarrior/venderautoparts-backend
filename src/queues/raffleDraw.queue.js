// src/queues/raffleDraw.queue.js
import { Queue } from "bullmq";
import bullRedis from "../config/bullmq.js";

export const raffleDrawQueue = new Queue("raffle-draw", {
  connection: bullRedis,
  defaultJobOptions: {
    removeOnComplete: true, // completed jobs Redis se clean ho jayein
    removeOnFail: 50,       // last 50 failed jobs rakho debug ke liye
    attempts: 3,            // failure pe 3 baar retry
    backoff: {
      type: "exponential",
      delay: 5000,          // 5s → 10s → 20s
    },
  },
});

// Helper — raffle create hone pe call karo
export const scheduleRaffleDraw = async (raffleId, drawDate) => {
  const delay = new Date(drawDate).getTime() - Date.now();

  if (delay <= 0) {
    console.warn(`Raffle ${raffleId} drawDate already past, skipping schedule`);
    return;
  }

  await raffleDrawQueue.add(
    "draw-winner",
    { raffleId: raffleId.toString() },
    {
      delay,
      jobId: `draw-${raffleId}`, // idempotent — duplicate job nahi banegi
    }
  );

  console.log(`Raffle draw scheduled: ${raffleId} in ${Math.round(delay / 1000)}s`);
};

// Helper — drawDate change hone pe call karo
export const rescheduleRaffleDraw = async (raffleId, newDrawDate) => {
  const existing = await raffleDrawQueue.getJob(`draw-${raffleId}`);
  if (existing) await existing.remove();
  await scheduleRaffleDraw(raffleId, newDrawDate);
};

// Helper — raffle cancel hone pe call karo
export const cancelRaffleDraw = async (raffleId) => {
  const existing = await raffleDrawQueue.getJob(`draw-${raffleId}`);
  if (existing) await existing.remove();
};