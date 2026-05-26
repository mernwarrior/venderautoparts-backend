import mongoose from "mongoose";
import { TICKET_STATUS } from "../utils/constant.js";

const modalSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },

    raffleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Raffle",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    answer: {
      type: String,
    },

    isWinner: {
      type: Boolean,
      default: false,
    },
    status:{
      type: String,
      enum: Object.values(TICKET_STATUS),
      default:TICKET_STATUS.PENDING
    },

    winnerDeclaredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

modalSchema.index({ raffle: 1, userId: 1, orderId:1 });

export default mongoose.model("Ticket", modalSchema);