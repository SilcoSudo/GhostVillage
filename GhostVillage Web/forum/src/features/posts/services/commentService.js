import axios from "../../../shared/services/axios";

const commentService = {
  // Get comments for a post
  getComments: async (postId, params = {}) => {
    const response = await axios.get(`/web/forum/${postId}/comments`, {
      params,
    });
    return response.data;
  },

  // Create a comment
  createComment: async (postId, commentData) => {
    const response = await axios.post(
      `/web/forum/${postId}/comments`,
      commentData,
    );
    return response.data;
  },

  // Update a comment
  updateComment: async (postId, commentId, commentData) => {
    const response = await axios.put(
      `/web/forum/${postId}/comments/${commentId}`,
      commentData,
    );
    return response.data;
  },

  // Delete a comment
  deleteComment: async (postId, commentId) => {
    const response = await axios.delete(
      `/web/forum/${postId}/comments/${commentId}`,
    );
    return response.data;
  },

  // Report a comment
  reportComment: async (postId, commentId, reportData) => {
    const response = await axios.post(
      `/web/forum/${postId}/comments/${commentId}/report`,
      reportData,
    );
    return response.data;
  },
};

export default commentService;
