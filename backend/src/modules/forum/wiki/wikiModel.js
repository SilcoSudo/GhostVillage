import mongoose from "mongoose";

const WikiSchema = new mongoose.Schema({
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
        maxlength: 500,
        default: "",
    },

    // === CATEGORIZATION ===
    category: {
        type: String,
        enum: [
            "Monster Database",
            "Map Guide",
            "Item Database",
            "Game Guide",
            "Tutorial",
            "Lore",
            "FAQ",
            "Patch Notes",
            "Other",
        ],
        default: "Other",
        required: true,
    },

    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }, ],

    // === GAME DATA (Flexible structure for monsters, maps, items) ===
    gameData: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    entityType: {
        type: String,
        enum: ["monster", "map", "item", "guide", "general", null],
        default: null,
    },

    entityId: {
        type: String,
        default: null,
    },

    // === METADATA ===
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    editors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],

    // === STATUS & VISIBILITY ===
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft",
    },

    isPublic: {
        type: Boolean,
        default: true,
    },

    isFeatured: {
        type: Boolean,
        default: false,
    },

    // === ENGAGEMENT ===
    views: {
        type: Number,
        default: 0,
    },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],

    // === VERSION CONTROL ===
    version: {
        type: Number,
        default: 1,
    },

    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    // === MEDIA ===
    coverImage: {
        type: String,
        default: null,
    },

    gallery: [{
        type: String,
    }, ],

    videoGuide: {
        type: String,
        default: null,
    },

    // === RELATIONS ===
    relatedWikis: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wiki",
    }, ],

    // === TIMESTAMPS ===
    publishedAt: {
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
// Note: slug already has unique: true, so no need for separate index
WikiSchema.index({ category: 1 });
WikiSchema.index({ status: 1 });
WikiSchema.index({ isFeatured: 1 });
WikiSchema.index({ entityType: 1, entityId: 1 });
WikiSchema.index({ createdAt: -1 });

// Text index for full-text search
WikiSchema.index({ title: "text", content: "text", tags: "text" });

// Update timestamp on save
WikiSchema.pre("save", function(next) {
    this.updatedAt = new Date();
    next();
});

const Wiki = mongoose.model("Wiki", WikiSchema);

export default Wiki;