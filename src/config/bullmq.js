import { Redis } from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "./const.js";

const bullRedis = new Redis({
  host: REDIS_HOST || "127.0.0.1",
  port: Number(REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // BullMQ ke liye required hai
  enableReadyCheck: false,    // BullMQ ke liye required hai
});

bullRedis.on("connect", () => console.log("✅ BullMQ Redis connected"));
bullRedis.on("error", (err) => console.error("❌ BullMQ Redis error:", err));

export default bullRedis;