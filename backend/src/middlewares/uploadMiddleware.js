import multer from "multer";
import { config } from "../config/env.js";

// Use memory storage - we'll upload to Cloudinary, not save locally
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = config.upload.allowedTypes || [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: ${allowedMimes.join(", ")}`),
      false,
    );
  }
};

// Multer configuration
const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize || 20 * 1024 * 1024, // 20MB default
  },
});

/**
 * Middleware for single avatar upload
 */
export const uploadAvatar = uploadMiddleware.single("avatar");

// Alias for post media uploads (field name = "media")
export const uploadMedia = uploadMiddleware.single("media");

/**
 * Middleware for multiple image uploads
 */
export const uploadMultiple = uploadMiddleware.array("images", 5);

/**
 * Validate upload middleware
 */
export const validateUpload = (req, res, next) => {
  if (!req.file && req.method !== "GET") {
    if (req.path.includes("/upload") || req.path.includes("/avatar")) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }
  }
  next();
};

export default uploadMiddleware;
