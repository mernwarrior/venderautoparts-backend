import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    supportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Support",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // attachments: [String],

    isAdmin: {
      type: Boolean,
      default: false,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ supportId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);