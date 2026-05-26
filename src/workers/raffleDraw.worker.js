// src/workers/raffleDraw.worker.js
import { Worker } from "bullmq";
import bullRedis from "../config/bullmq.js";
import { drawRaffleWinner } from "../services/drawn.service.js";

const raffleDrawWorker = new Worker(
  "raffle-draw",
  async (job) => {
    const { raffleId } = job.data;
    console.log(`Processing raffle draw: ${raffleId}`);
    await drawRaffleWinner(raffleId);
  },
  {
    connection: bullRedis,
    concurrency: 10, // ek saath 10 draws parallel
  }
);

raffleDrawWorker.on("completed", (job) => {
  console.log(`✅ Draw completed — job: ${job.id}`);
});

raffleDrawWorker.on("failed", (job, err) => {
  console.error(`❌ Draw failed — job: ${job.id}`, err.message);
  // Yahan Sentry alert laga sakte ho
});

raffleDrawWorker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

export default raffleDrawWorker;