import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  pageHeading: {
    type: String,
    required: true,
  },
  sections: [
    {
      title: String, 
      faqs: [
        {
          question: String,
          answer: String,
        },
      ],
    },
  ],
});

export default mongoose.model("FAQ", faqSchema);