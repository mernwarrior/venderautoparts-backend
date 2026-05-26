import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },

    subCategory: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    stockId: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    saleAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      default: '',
    },

    brandTitle: {
      type: String,
      required: true,
      trim: true,
    },

    // // OPTIONAL SLUG
    // urlSlug: {
    //   type: String,
    //   unique: true,
    //   sparse: true,
    //   lowercase: true,
    //   trim: true,
    //   default: '',
    // },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast category lookups
productSchema.index({
  category: 1,
  subCategory: 1,
});

const Product = mongoose.model('Product', productSchema);

export default Product;