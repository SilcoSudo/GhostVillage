import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Ensure userId and friendId combination is unique
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Prevent user from adding themselves as friend
friendSchema.pre("save", async function (next) {
  if (this.userId.equals(this.friendId)) {
    throw new Error("Cannot add yourself as a friend");
  }
  next();
});

// Populate User references when returning JSON
friendSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return obj;
};

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
