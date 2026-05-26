import { validateToken } from "../services/user.service.js";
import { getCache } from "../utils/cacheService.js";

export const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];

      // ✅ Check Bearer token
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "No token provided",
        });
      }

      const token = authHeader.split(" ")[1];

      // ✅ Check blacklist
      const isBlacklisted = await getCache(
        `blacklist:accessToken:${token}`
      );

      if (isBlacklisted) {
        return res.status(401).json({
          message: "Token expired or user logged out",
        });
      }

      // ✅ Validate token
      const user = await validateToken(token);

      req.user = user;

      // ✅ Role check
      if (
        allowedRoles.length &&
        !allowedRoles.includes(user.role)
      ) {
        return res.status(403).json({
          message: "Forbidden: Insufficient permissions",
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        message: err.message || "Unauthorized",
      });
    }
  };
};