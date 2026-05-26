import mongoose from "mongoose";
import { PAYMENT_METHOD, TRANSACTION_STATUS } from "../utils/constant.js";

const modalSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    raffleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Raffle",
      required: true,
    },

    ticketQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    ticketIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],

    amount: {
      type: Number,
      required: true,
    },

    promoCode: {
      type: String,
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      //  default: TRANSACTION_STATUS.PENDING,
       default: TRANSACTION_STATUS.SUCCESS,
    },

    paymentIntentId: {
      type: String,
    },
  },
  { timestamps: true }
);

modalSchema.index({ user: 1, raffle: 1  });

export default mongoose.model("Order", modalSchema);