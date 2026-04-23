import axios from "../../../shared/services/axios";

/**
 * Upload media (image or video) to backend
 * @param {File} file - File selected in browser
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append("media", file); // Use 'media' to match uploadMedia middleware

  const response = await axios.post("/web/forum/upload-media", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 600000,
  });

  return response.data.data; // Returns { url, publicId }
};
