import MessageService from "./messageService.js";

class MessageController {
  /**
   * POST /api/web/message/send
   * Send a message
   * Body: { recipientId, content }
   */
  static async sendMessage(req, res) {
    try {
      const senderId = req.user._id;
      const { recipientId, content } = req.body;
      const io = req.app.get("io");

      if (!recipientId || !content) {
        return res.status(400).json({
          success: false,
          message: "Recipient ID and content are required",
        });
      }

      const message = await MessageService.sendMessage(
        senderId,
        recipientId,
        content,
      );

      // Emit message via Socket.io for real-time delivery
      if (io) {
        io.to(`user_${recipientId}`).emit("message:received", {
          message: {
            _id: message._id,
            senderId: message.senderId._id,
            senderName: message.senderId.fullname,
            senderAvatar: message.senderId.avatar,
            content: message.content,
            createdAt: message.createdAt,
            isRead: false,
          },
        });
      }

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: message,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : "Failed to send message",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/web/message/conversation/:userId
   * Get conversation with a specific user
   * Query: ?limit=50&skip=0
   */
  static async getConversation(req, res) {
    try {
      const currentUserId = req.user._id;
      const { userId } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const messages = await MessageService.getConversation(
        currentUserId,
        userId,
        parseInt(limit),
        parseInt(skip),
      );

      // Mark messages as read
      await MessageService.markAsRead(currentUserId, userId);

      res.status(200).json({
        success: true,
        message: "Conversation retrieved successfully",
        data: messages,
      });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get conversation",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/web/message/unread-count
   * Get total unread messages count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user._id;

      const count = await MessageService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        message: "Unread count retrieved successfully",
        data: count,
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get unread count",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/web/message/last-messages
   * Get last message with each friend
   */
  static async getLastMessagesWithFriends(req, res) {
    try {
      const userId = req.user._id;

      const messages = await MessageService.getLastMessagesWithFriends(userId);

      res.status(200).json({
        success: true,
        message: "Last messages retrieved successfully",
        data: messages,
      });
    } catch (error) {
      console.error("Get last messages error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get last messages",
        error: error.message,
      });
    }
  }
}

export default MessageController;
