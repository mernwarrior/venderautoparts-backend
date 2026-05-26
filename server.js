import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import { initCronJobs } from "./src/crons/index.js";
import "./src/workers/raffleDraw.worker.js";

const startServer = async () => {
  try {
    // MongoDB Connection
    await connectDB();

    // Redis Connection
    // Agar Redis optional hai to try-catch use karo
    try {
      await connectRedis();
      console.log("✅ Redis Connected");
    } catch (redisError) {
      console.log("⚠️ Redis connection failed");
      console.log(redisError.message);
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);

      // Start Cron Jobs
      initCronJobs();
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();