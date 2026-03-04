import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isHiddenByModeration: {
      type: Boolean,
      default: false,
    },
    reports: [
      {
        reporter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          trim: true,
          required: true,
        },
        aiModeration: {
          isValidReport: {
            type: Boolean,
            default: false,
          },
          label: {
            type: String,
            enum: ["spam", "scam", "abuse", "adult", "misinfo", "no_violation"],
            default: "no_violation",
          },
          confidence: {
            type: Number,
            default: 0,
            min: 0,
            max: 1,
          },
          reason: {
            type: String,
            default: "",
          },
          evidence: {
            type: [String],
            default: [],
          },
          recommendedAction: {
            type: String,
            enum: ["keep", "warn", "hide_temp", "remove", "escalate_human"],
            default: "escalate_human",
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
commentSchema.index({ post: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
