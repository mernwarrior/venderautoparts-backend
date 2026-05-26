import { validateToken } from "../services/user.service.js";
import { getCache } from "../utils/cacheService.js";

export const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    try {
       const isBlacklisted = await getCache(`blacklist:accessToken:${token}`);

      if (isBlacklisted) {
        return res.status(401).json({
          message: "Token expired or user logged out",
        });
      }

      const user = await validateToken(token);
      req.user = user;

      // If roles are defined, check if user role is allowed
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      next();
    } catch (err) {
      return res.status(err.message.includes("Forbidden") ? 403 : 401).json({ message: err.message });
    }
  };
};

// import { JWT_REFRESH_SECRET } from "../config/const.js";
// import { validateToken } from "../services/user.service.js";
// import jwt from "jsonwebtoken";

// export const authMiddleware = (allowedRoles = []) => {
//   return async (req, res, next) => {
//     try {
//       let user;

//       // ✅ 1. Try accessToken (Authorization header)
//       const authHeader = req.headers["authorization"];

//       if (authHeader && authHeader.startsWith("Bearer ")) {
//         const token = authHeader.split(" ")[1];
//         user = await validateToken(token); // accessToken validate
//       } 
//       // ✅ 2. Fallback → refreshToken (cookie)
//       else if (req.cookies?.refreshToken) {
//         const refreshToken = req.cookies.refreshToken;

//         const decoded = jwt.verify(
//           refreshToken,
//           JWT_REFRESH_SECRET
//         );

//         user = decoded; // { id, role }
//       } 
//       // ❌ No token
//       else {
//         return res.status(401).json({ message: "Unauthorized - No token" });
//       }

//       req.user = user;

      

//       // ✅ Role check
//       if (allowedRoles.length && !allowedRoles.includes(user.role)) {
//         return res
//           .status(403)
//           .json({ message: "Forbidden: Insufficient permissions" });
//       }

//       next();
//     } catch (err) {
//       return res.status(401).json({
//         message: "Unauthorized - Invalid or expired token",
//       });
//     }
//   };
// };