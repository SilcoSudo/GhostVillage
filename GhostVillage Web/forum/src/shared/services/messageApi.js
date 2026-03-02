import instance from "./axios.js";

const messageApi = {
  /**
   * Send a message
   */
  sendMessage: async (recipientId, content) => {
    const response = await instance.post("/web/message/send", {
      recipientId,
      content,
    });
    return response.data;
  },

  /**
   * Get conversation with a user
   */
  getConversation: async (userId, limit = 50, skip = 0) => {
    const response = await instance.get(
      `/web/message/conversation/${userId}?limit=${limit}&skip=${skip}`,
    );
    return response.data;
  },

  /**
   * Get total unread messages count
   */
  getUnreadCount: async () => {
    const response = await instance.get("/web/message/unread-count");
    return response.data;
  },

  /**
   * Get last message with each friend
   */
  getLastMessagesWithFriends: async () => {
    const response = await instance.get("/web/message/last-messages");
    return response.data;
  },
};

export default messageApi;
