import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  // Basic required fields
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["General", "Discussion", "Trading", "Team Up", "Bug Report"],
    default: "General",
  },

  // Author reference
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  // Media
  media: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: false,
        default: null,
      },
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
    },
  ],

  // Interaction arrays
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
    },
  ],

  // Counters
  commentCount: {
    type: Number,
    default: 0,
  },

  // Status flags
  isLocked: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },

  // Timestamps
  editedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1 });
PostSchema.index({ author: 1 });
PostSchema.index({ title: "text", body: "text" }); // Text index for search

const Post = mongoose.model("Post", PostSchema);

export default Post;
