import mongoose from "mongoose";
import { ROLE_TYPE, GENDER_TYPE, USER_STATUS } from "../utils/constant.js";
import Counter from "./counter.model.js";

const modalSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      // unique: true,
      index: true
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    providerId: {
      type: String,
    },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    tempEmail: {
      type: String,
      default: null
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    tempPassword: {
      type: String,
      default: null
    },

    pattern: {
      type: Number,
    },

    gender: {
      type: String,
      enum: [GENDER_TYPE.MALE, GENDER_TYPE.FEMALE, GENDER_TYPE.OTHER],
    },

    role: {
      type: String,
      enum: [ROLE_TYPE.HOST, ROLE_TYPE.ENTRANT, ROLE_TYPE.ADMIN],
      default: ROLE_TYPE.ENTRANT,
    },

    countryCode: {
      type: String,
      default: "+91",
    },

    phoneNo: {
      type: String,
      unique: true,
      // match: /^[0-9]{10}$/,
    },

    tempPhone: {
      type: String,
      default: null
    },



    isBlocked: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    expiresIn: {
      type: Date,
    },

    passwordResetExpires: {
      type: Date,
    },

    avatar: {
      type: String,
    },

    coverImage: {
      type: String,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
    },

    description: {
      type: String,
    },

    biography: {
      type: String,
    },

    website: {
      type: String,
    },

    facebook: {
      type: String,
    },

    instagram: {
      type: String,
    },

    twitter: {
      type: String,
    },

    tiktok: {
      type: String,
    },

    linkedIn: {
      type: String,
    },

    youtube: {
      type: String,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    wallet:{
      type:Number
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String
    },
  },
  { timestamps: true }
);


modalSchema.index({ role: 1,  userName: "text", email: "text" });

export default mongoose.model("User", modalSchema);