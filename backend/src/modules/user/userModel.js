import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Not required for OAuth users
      minlength: 8,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true, // Allow multiple null values but unique non-null values
    },
    dateOfBirth: {
      type: Date,
      required: false, // Not required for OAuth users
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
    },
    isMute: {
      type: Boolean,
      default: false,
    },
    moderation: {
      violationCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastViolationAt: {
        type: Date,
        default: null,
      },
      mutedUntil: {
        type: Date,
        default: null,
      },
      lastAction: {
        type: String,
        enum: ["none", "warning", "mute", "merged_hide_only"],
        default: "none",
      },
      lastActionAt: {
        type: Date,
        default: null,
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    currentSessionId: {
      type: String,
      default: null,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    verificationTokenHash: {
      type: String,
      default: null,
    },
    verificationUsed: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    resetPasswordTokenHash: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    emailVisibility: {
      type: Boolean,
      default: true,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Skip hashing if password is null (OAuth users)
  if (!this.password || !this.isModified("password")) return next();

  // If password already looks like a bcrypt hash, skip re-hashing
  if (typeof this.password === "string" && this.password.startsWith("$2")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false; // OAuth users have no password
  return await bcrypt.compare(password, this.password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
