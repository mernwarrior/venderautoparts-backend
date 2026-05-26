import mongoose from "mongoose";

const generalSettingsSchema = new mongoose.Schema(
  {
    footer: {
      logo: String,
      copyright: String,
      socialMedia: [
        {
          name: String,
          url: String,
        },
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("GeneralSettings", generalSettingsSchema);