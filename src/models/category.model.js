import mongoose from "mongoose";

const modalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
    },

   slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
     image: {
      type: String, 
      default: null,
    },

  },
  { timestamps: true }
);
modalSchema.index({ role: 1 });

export default mongoose.model("Category", modalSchema);
