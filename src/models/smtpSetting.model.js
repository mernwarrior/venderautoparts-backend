import mongoose from "mongoose";

const smtpSettingSchema = new mongoose.Schema({
  host:      { type: String, required: true },
  port:      { type: Number, default: 587 },
  secure:    { type: Boolean, default: false },
  username:  { type: String, required: true },
  password:  { type: String, required: true }, // AES encrypted
  fromEmail: { type: String, required: true },
  fromName:  { type: String, default: "RaffalStar" },
  isActive:  { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const SmtpSetting = mongoose.model("SmtpSetting", smtpSettingSchema);
export default SmtpSetting;