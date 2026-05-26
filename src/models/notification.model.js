import mongoose from "mongoose";

const modalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            trim: true,
            default: null
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        },
        forAll: {
            type: Boolean,
            default: false
        }


    },
    { timestamps: true }
);
modalSchema.index({ userId: 1 });

export default mongoose.model("Notification", modalSchema);
