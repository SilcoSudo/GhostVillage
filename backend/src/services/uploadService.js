import cloudinary from "cloudinary";
import { config } from "../config/env.js";

const normalizeCloudinaryError = (error) => {
  const nested = error?.error || {};
  return {
    message:
      error?.message || nested?.message || "Unknown Cloudinary upload error",
    statusCode:
      error?.http_code ||
      error?.statusCode ||
      error?.status ||
      nested?.http_code ||
      nested?.statusCode ||
      nested?.status ||
      0,
    name: error?.name || nested?.name || "CloudinaryError",
    raw: error,
  };
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  const isConfigured =
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== "your-cloud-name" &&
    apiKey !== "your-api-key" &&
    apiSecret !== "your-api-secret";
  return isConfigured;
};

// Configure Cloudinary only if credentials are provided
if (isCloudinaryConfigured()) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  });
  console.log(" Cloudinary configured successfully");
} else {
  console.warn(
    "⚠️  Cloudinary not configured - using base64 fallback for avatar uploads",
  );
}

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary response with URL
 */
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  // Check if Cloudinary is configured
  if (!isCloudinaryConfigured()) {
    // Fallback: convert to base64 data URI
    const base64 = fileBuffer.toString("base64");
    const mimeType = options.mimeType || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64}`;

    return {
      secure_url: dataUri,
      public_id: `local_${Date.now()}`,
      resource_type: "image",
      format: mimeType.split("/")[1],
    };
  }

  const maxAttempts = 3;

  const doUpload = () =>
    new Promise((resolve, reject) => {
      let settled = false;
      const finishResolve = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const finishReject = (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      const uploadParams = {
        resource_type: "auto",
        folder: options.folder || "ghostvillage/avatars",
        public_id: options.public_id || undefined,
        overwrite: options.overwrite !== false,
        timeout: options.timeout || 120000,
        ...options,
      };

      if (
        uploadParams.resource_type !== "video" &&
        uploadParams.resource_type !== "raw" &&
        uploadParams.transformation === undefined
      ) {
        uploadParams.transformation = [
          { width: 1280, height: 720, crop: "fill" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ];
      }

      const uploadStream = cloudinary.v2.uploader.upload_stream(
        uploadParams,
        (error, result) => {
          if (error) {
            finishReject(error);
          } else {
            finishResolve(result);
          }
        },
      );

      uploadStream.on("error", (streamError) => {
        finishReject(streamError);
      });

      uploadStream.end(fileBuffer);
    });

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await doUpload();
    } catch (error) {
      const normalized = normalizeCloudinaryError(error);
      lastError = normalized;
      const statusCode = normalized.statusCode;
      const isRateLimit = statusCode === 429;
      const isLastAttempt = attempt === maxAttempts;

      if (!isRateLimit || isLastAttempt) {
        break;
      }

      const delayMs = 500 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const statusCode = lastError?.statusCode || 0;
  const message = lastError?.message || "Unknown upload error";
  const suffix = statusCode ? ` (status ${statusCode})` : "";
  const uploadError = new Error(
    `Cloudinary upload failed: ${message}${suffix}`,
  );
  uploadError.statusCode = statusCode;
  uploadError.name = lastError?.name || "CloudinaryUploadError";
  uploadError.raw = lastError?.raw;
  throw uploadError;
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  // Skip deletion if Cloudinary not configured or if it's a local/base64 image
  if (!isCloudinaryConfigured() || !publicId || publicId.startsWith("local_")) {
    return { result: "skipped" };
  }

  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion failed:", error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string} - Public ID
 */
export const extractPublicIdFromUrl = (cloudinaryUrl) => {
  try {
    if (!cloudinaryUrl || typeof cloudinaryUrl !== "string") {
      return null;
    }

    // URL format: https://res.cloudinary.com/cloud-name/image/upload/v123/folder/public-id.ext
    const match = cloudinaryUrl.match(/\/upload\/(v[^/]+\/)?(.+?)(\.[^.]+)?$/);
    return match ? match[2] : null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  isCloudinaryConfigured,
};
