import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
  hero: {
    heading: String,
    subheading: String,
  },
  plans: [
    {
      name: String,
      tagline: String,
      badge: String,
      price: Number,
      currency: String,
      billingCycle: String,
      isPopular: Boolean,
      buttonText: String,
      sortOrder: Number,
      features: [String],
    },
  ],
});

export default mongoose.model("Pricing", pricingSchema);