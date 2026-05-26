import mongoose from "mongoose";

const modalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            trim: true,
            ref:"User",
            default: null
        },
        action: {
            type: String,
            required: true
        },
        changes: {
            type: Object,
            required: true
        },
        ipAddress: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            default: false
        },

    },
    { timestamps: true }
);
modalSchema.index({ userId: 1 , ipAddress:1});

export default mongoose.model("Audit", modalSchema);
