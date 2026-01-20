import axios from "../../../shared/services/axios";

// Get all posts
export const getPosts = async (params = {}) => {
  const response = await axios.get("/web/forum", { params });
  return response.data;
};

// Get single post
export const getPost = async (postId) => {
  const response = await axios.get(`/web/forum/${postId}`);
  return response.data;
};

// Create post
export const createPost = async (postData) => {
  const response = await axios.post("/web/forum", postData);
  return response.data;
};

// Update post
export const updatePost = async (postId, postData) => {
  const response = await axios.put(`/web/forum/${postId}`, postData);
  return response.data;
};

// Delete post
export const deletePost = async (postId) => {
  const response = await axios.delete(`/web/forum/${postId}`);
  return response.data;
};

// Like/Unlike post
export const toggleLike = async (postId) => {
  const response = await axios.post(`/web/forum/${postId}/like`);
  return response.data;
};

// Bookmark/Unbookmark post
export const toggleBookmark = async (postId) => {
  const response = await axios.post(`/web/forum/${postId}/bookmark`);
  return response.data;
};

// Get user's posts
export const getUserPosts = async (userId, params = {}) => {
  const response = await axios.get(`/users/${userId}/posts`, { params });
  return response.data;
};
