import axios from './axios';

/**
 * Upload Service
 * Handles file uploads to backend
 */

/**
 * Upload a single image file
 * @param {File} file - The image file to upload
 * @param {string} type - Upload type (e.g., 'avatar', 'announcement', 'wiki')
 * @returns {Promise<Object>} - Response with image URL
 */
export const uploadImage = async (file, type = 'announcement') => {
  const formData = new FormData();
  formData.append('avatar', file); // Backend expects 'avatar' field
  formData.append('type', type);

  const response = await axios.post('/web/user/avatar/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Upload multiple images
 * @param {FileList|Array} files - Array of image files
 * @returns {Promise<Array>} - Array of uploaded image URLs
 */
export const uploadMultipleImages = async (files) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });

  const response = await axios.post('/web/user/upload-images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`,
    };
  }

  return { valid: true };
};

/**
 * Create image preview URL from File object
 * @param {File} file - Image file
 * @returns {string} - Object URL for preview
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke image preview URL to free memory
 * @param {string} url - Object URL to revoke
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
