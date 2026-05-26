import mongoose from "mongoose";
import { SUPPORT_PRIORITY, SUPPORT_STATUS } from "../utils/constant.js";

const supportSchema = new mongoose.Schema(
  {
      category: {
    type: String,
      required: false
    },
    subCategory: {
      type: String,
      required: false
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    screenshot: {
      type: String,
      required: false
    },

    status: {
      type: String,
      enum:Object.values(SUPPORT_STATUS),
      default: SUPPORT_STATUS.OPEN,
      index: true,
    },

    priority: {
      type: String,
      enum: Object.values(SUPPORT_PRIORITY),
      default: SUPPORT_PRIORITY.MEDIUM,
    },

       lastMessage: String,
    lastMessageAt: Date,


  },
  { timestamps: true }
);

supportSchema.index({ userId: 1  });


export default mongoose.model("Support", supportSchema);