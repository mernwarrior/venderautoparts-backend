import mongoose from "mongoose";

const prizeVerificationSchema = new mongoose.Schema({
  raffleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle', required: true },
  ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tickets', required: true },
  winnerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  hostId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },

  // Winner side
  kycDocument:      { type: String },   // ID proof file path
  kycSubmittedAt:   { type: Date },
  kycApprovedAt:   { type: Date },
  winnerProof:     [{ type: String}],   // delivery confirm photo/video
  winnerProofAt:    { type: Date },

  // Host side
  hostDeliveryProof:  [{ type: String}], 
  hostProofAt:        { type: Date },

  // Admin
  adminApprovedAt:  { type: Date },
  adminNote:        { type: String },

  status: {
    type: String,
    enum: ['kyc_pending', 'kyc_submitted', 'kyc_verified', 'delivery_pending','proof_submitted', 'approved', 'rejected'],
    default: 'kyc_pending',
  },
}, { timestamps: true });

export default mongoose.model("prizeVerification", prizeVerificationSchema);