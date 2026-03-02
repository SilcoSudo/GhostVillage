import mongoose from "mongoose";

const MoonEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["MOON_PHASE", "WEATHER", "SPECIAL", "OTHER"],
      default: "MOON_PHASE",
    },
    uiIcon: {
      type: String,
      default: "",
    },
    effectDescription: {
      type: String,
      default: "",
    },
    // Global multipliers for rewards
    coinMultiplier: {
      type: Number,
      default: 1,
      min: 0,
    },
    expMultiplier: {
      type: Number,
      default: 1,
      min: 0,
    },
    // Activation status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Scheduling (for future expansion)
    scheduleType: {
      type: String,
      enum: ["ALWAYS", "SCHEDULED", "MANUAL"],
      default: "ALWAYS",
    },
    activeFrom: {
      type: Date,
      default: null,
    },
    activeTo: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const MoonEvent = mongoose.model("MoonEvent", MoonEventSchema);
export default MoonEvent;
