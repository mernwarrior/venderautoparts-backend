import mongoose from "mongoose";

const PrivacySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Privacy Policy",
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("privacy", PrivacySchema);