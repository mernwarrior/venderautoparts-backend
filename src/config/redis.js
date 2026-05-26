import { createClient } from "redis";
import { REDIS_HOST, REDIS_PORT } from "./const.js";

const redisClient = createClient({
  socket: {
    host: REDIS_HOST || "127.0.0.1",
    port: REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

export const connectRedis = async () => {
  await redisClient.connect();
  console.log("✅ Redis Connected");
};

export default redisClient;