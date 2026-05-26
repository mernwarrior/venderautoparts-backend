import mongoose from "mongoose";
import { DELIVERY_METHOD, DRAW_STATUS, RAFFAL_STATUS } from "../utils/constant.js";
import Counter from "./counter.model.js";

const raffleSchema = new mongoose.Schema( 
  {
    raffleId: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

       slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    featureMedia:
      {
        type: String, // photo/video URLs
      },
    
    featureImage: [
      {
        type: String, // photo/video URLs
      },
    ],

    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalTickets: {
      type: Number,
      required: true,
    },

    soldTickets: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxTicketsPerUser: {
      type: Number,
      default: 1,
    },

    raffleStartDate: {
      type: Date,
      required: true,
    },


    raffleEndDate: {
      type: Date,
      required: true,
    },

    drawnAt: {
      type: Date,
      // required: true,
    },

    skillQuestion: {
      type: String,
      default: null,
    },

    charityTag: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      required: true,
    },

    deliveryMethod: {
      type: String,
      enum: Object.values(DELIVERY_METHOD),
      required: true,
    },

    prizeProfDoc: 
      {
        type: String, // file URLs
      },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(RAFFAL_STATUS),
      default: RAFFAL_STATUS.PENDING,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

        rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },

    


    winnerTicket: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Ticket"
},

drawDate:        { type: Date, required: true },
drawStatus: {
  type: String,
   enum: Object.values(DRAW_STATUS),
  default: DRAW_STATUS.PENDING
},
kycDeadline:    { type: Date }, 
redrawCount:    { type: Number, default: 0 },
winnerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
winnerTicketId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },


  },
  { timestamps: true }
);

// Auto generate raffleId

async function getNextRaffleId() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "raffleId" },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  return String(counter.seq).padStart(6, "0");
}

raffleSchema.pre("save", async function (next) {
  if (this.isNew && !this.raffleId) {
    this.raffleId = await getNextRaffleId();
  }
  // next();
});

raffleSchema.index({ status: 1 });
raffleSchema.index({ category: 1 });

export default mongoose.model("Raffle", raffleSchema);