import mongoose from "mongoose";

const featureSchema = new mongoose.Schema({
  pageHeading: {
    type: String,
    required: true,
  },
  heroSubtitle: {
    type: String,
    required: true,
  },
  categories: [
    {
      name: String,
      features: [
        {
          title: String,
          description: String,
        },
      ],
    },
  ],
});

export default mongoose.model("Feature", featureSchema);