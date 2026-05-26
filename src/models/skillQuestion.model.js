import mongoose from "mongoose";

const modalSchema = new mongoose.Schema(
  
 
{
  raffleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Raffle"
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  message: String,
  rating: Number
},

  
  { timestamps: true }
);

export default mongoose.model("Testmonials", modalSchema);
