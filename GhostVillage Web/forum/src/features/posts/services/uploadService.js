import axios from "../../../shared/services/axios";

/**
 * Upload image to Cloudinary via backend
 * @param {File} file - Image file from browser
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file); // Use 'avatar' to match uploadAvatar middleware

  const response = await axios.post("/web/forum/upload-image", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data; // Returns { url, publicId }
};
