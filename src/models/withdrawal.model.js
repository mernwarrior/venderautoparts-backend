import mongoose from "mongoose";
import { BANK_STATUS, WITHDRAWAL_STATUS } from "../utils/constant.js";

const modalSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, 

    commission: {
        type: Number,
        required: true,
    },


   status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
    },


   isDeleted: {
      type: Boolean,
      default: false,
    },

   deletedAt: {
      type: Date,
    },

   approvedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }, 

   rejectedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

},
  { timestamps: true }
);
modalSchema.index({ userId: 1, status: 1 });

export default mongoose.model("withdrawal", modalSchema);
