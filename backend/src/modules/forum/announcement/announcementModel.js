import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema({
    // === BASIC INFO ===
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    // === CONTENT ===
    content: {
        type: String,
        required: true,
    },

    excerpt: {
        type: String,
        maxlength: 300,
        default: "",
    },

    // === METADATA ===
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // === STATUS & VISIBILITY ===
    isActive: {
        type: Boolean,
        default: true,
    },

    isPinned: {
        type: Boolean,
        default: false,
    },

    // === ENGAGEMENT ===
    views: {
        type: Number,
        default: 0,
    },

    // === MEDIA ===
    coverImage: {
        type: String,
        default: null,
    },

    // === TIMESTAMPS ===
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
// Note: slug already has unique: true
AnnouncementSchema.index({ isActive: 1, isPinned: -1, createdAt: -1 });
AnnouncementSchema.index({ createdAt: -1 });

// Text index for full-text search
AnnouncementSchema.index({ title: "text", content: "text" });

// Update timestamp on save
AnnouncementSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Announcement = mongoose.model("Announcement", AnnouncementSchema);

export default Announcement;
