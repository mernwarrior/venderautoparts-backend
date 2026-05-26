import mongoose from "mongoose";

export const validateObjectIdParam = (req, res, next) => {
  const params = req.params;

  for (const key in params) {
    const value = params[key];

    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid ID format for "${key}". Must be a valid MongoDB ObjectId.`,
      });
    }
  }

  next();
};