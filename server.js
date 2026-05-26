import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";
import { initCronJobs } from "./src/crons/index.js";
import "./src/workers/raffleDraw.worker.js";
dotenv.config();

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      // 🔥 Start cron jobs here
      initCronJobs();
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();