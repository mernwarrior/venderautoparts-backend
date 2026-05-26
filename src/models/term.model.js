import mongoose from "mongoose";

const TermsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Terms & Conditions",
    },
    description: {
      type: String, // HTML from editor
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("terms", TermsSchema);