// models/raffleEarning.model.js
import mongoose from 'mongoose';

const raffleEarningSchema = new mongoose.Schema({
  raffleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
    required: true,
    unique: true, 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }, //as Host define
  grossAmount: { type: Number, required: true }, 
  platformFee: { type: Number, required: true }, 
  netAmount:   { type: Number, required: true }, 

  status: {
    type: String,
    enum: ['locked', 'released'],
    default: 'locked',
  },

  releasedAt: { type: Date, default: null },
}, { timestamps: true });

raffleEarningSchema.index({ userId: 1, status: 1 });

export default mongoose.model('RaffleEarning', raffleEarningSchema);