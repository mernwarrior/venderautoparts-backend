import mongoose from 'mongoose';

// ─── Sub-document: each ordered item ────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    stockId: { type: String, default: '' },
  },
  { _id: false }
);

// ─── Main Order Schema ──────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    // Shipping / Customer info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },

    // Order items
    items: {
      type: [orderItemSchema],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0,
    },

    // Pricing
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 99,
    },

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Meta
    orderDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('autoOrder', orderSchema);

export default Order;