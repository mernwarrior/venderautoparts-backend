import redisClient from "../config/redis.js";

export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Redis GET Error:", error);
    return null;
  }
};

export const setCache = async (key, data, ttl = 60) => {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (error) {
    console.error("Redis SET Error:", error);
  }
};

export const deleteCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Redis DEL Error:", error);
  }
};