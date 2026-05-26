import mongoose from "mongoose";

const AboutSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },

  },
  
  { timestamps: true }
);

export default mongoose.model("about", AboutSchema);