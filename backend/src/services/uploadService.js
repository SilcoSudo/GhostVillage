import cloudinary from 'cloudinary';
import { config } from '../config/env.js';

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  return cloudName && apiKey && apiSecret && 
         cloudName !== 'your-cloud-name' && 
         apiKey !== 'your-api-key' && 
         apiSecret !== 'your-api-secret';
};

// Configure Cloudinary only if credentials are provided
if (isCloudinaryConfigured()) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.warn('⚠️  Cloudinary not configured - using base64 fallback for avatar uploads');
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
    const base64 = fileBuffer.toString('base64');
    const mimeType = options.mimeType || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64}`;
    
    return {
      secure_url: dataUri,
      public_id: `local_${Date.now()}`,
      resource_type: 'image',
      format: mimeType.split('/')[1],
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: options.folder || 'ghostvillage/avatars',
        public_id: options.public_id || undefined,
        overwrite: options.overwrite !== false, // Default to true
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  // Skip deletion if Cloudinary not configured or if it's a local/base64 image
  if (!isCloudinaryConfigured() || !publicId || publicId.startsWith('local_')) {
    return { result: 'skipped' };
  }

  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
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
    if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') {
      return null;
    }
    
    // URL format: https://res.cloudinary.com/cloud-name/image/upload/v123/folder/public-id.ext
    const match = cloudinaryUrl.match(/\/upload\/(v[^/]+\/)?(.+?)(\.[^.]+)?$/);
    return match ? match[2] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  isCloudinaryConfigured,
};
