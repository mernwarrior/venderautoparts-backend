import mongoose from "mongoose";
import { BANK_STATUS } from "../utils/constant.js";

const modalSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      trim: true,
    },

    bankHolderName: {
      type: String,
      required: true,
      trim: true,
    },

   accountNo: {
      type: Number,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    ifscCode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, 


    state: {
      type: String,
      required: true,
      trim: true,
    },   

    frontPhoto: {
      type: String,
      required: true,   

    },
    backPhoto: {
      type: String,
      required: true,
    },

   status: {
      type: String,
      enum: Object.values(BANK_STATUS),
      default: "pending",
    },

   rejectionReason: {
      type: String,
      trim: true,
    },

   isDeleted: {
      type: Boolean,
      default: false,
    },

   deletedAt: {
      type: Date,
    },

   verifiedAt: {
      type: Date,
    },

   rejectedAt: {
      type: Date,
    },

},
  { timestamps: true }
);
modalSchema.index({ userId: 1, accountNo: 1, bankName: 1, ifscCode: 1 });

export default mongoose.model("bank", modalSchema);
