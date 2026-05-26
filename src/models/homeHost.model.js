import mongoose from "mongoose";

const HostSchema = new mongoose.Schema(
  {
    hero: {
      title: { type: String },
      subtitle: { type: String },
      bgImage: { type: String },
      trustText: { type: String },
    },

    featuredRaffles: {
      title: { type: String },
      description: { type: String },
    },
      numbersSpeak: {
      title: {
        type: String,
        default: "Numbers Speak Volumes",
      },
      items: [
        {
          value: { type: String }, 
          label: { type: String }, 
        },
      ],
    },

    toolsSection: {
      title: {
        type: String,
        default: "Tools Built For Results",
      },

      items: [
        {
          icon: { type: String },        
          title: { type: String },
          description: { type: String },
        },
      ],
    },
       startRaffleSection: {
      smallHeading: { type: String },     
      titleHeading: { type: String },       
      description: { type: String }, 
    },

  },
  
  { timestamps: true }
);

export default mongoose.model("HomeHost", HostSchema);