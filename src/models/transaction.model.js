import mongoose from "mongoose";
import { PAYMENT_METHOD, TRANSACTION_STATUS, TRANSACTION_TYPE } from "../utils/constant.js";

const modalSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: function () {
        return this.type !== TRANSACTION_TYPE.RAFFLE_REWARD;
      },
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD)
    },

    gatewayTransactionId: {
      type: String,
    },

    type:{
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: true,

    },

    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
    },

    response: {
      type: Object, // raw gateway response
    },
  },
  { timestamps: true }
);

modalSchema.index({ orderId: 1, userId:1});

export default mongoose.model("Transaction", modalSchema);