import Message from "./messageModel.js";

class MessageService {
  /**
   * Send a message from one user to another
   */
  static async sendMessage(senderId, recipientId, content) {
    try {
      if (!content || content.trim() === "") {
        throw new Error("Message content cannot be empty");
      }

      const message = new Message({
        senderId,
        recipientId,
        content: content.trim(),
      });

      await message.save();

      // Populate sender info
      const populatedMessage = await message.populate("senderId", [
        "_id",
        "username",
        "fullname",
        "avatar",
      ]);

      return populatedMessage;
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  }

  /**
   * Get conversation between two users
   * Returns messages sorted by newest first
   */
  static async getConversation(userId, otherUserId, limit = 50, skip = 0) {
    try {
      const messages = await Message.find({
        $or: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      })
        .populate("senderId", ["_id", "username", "fullname", "avatar"])
        .populate("recipientId", ["_id", "username", "fullname", "avatar"])
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      // Reverse to get chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error("Get conversation error:", error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(userId, senderId) {
    try {
      const updated = await Message.updateMany(
        {
          recipientId: userId,
          senderId: senderId,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
      );

      return updated;
    } catch (error) {
      console.error("Mark as read error:", error);
      throw error;
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Message.countDocuments({
        recipientId: userId,
        isRead: false,
      });

      return count;
    } catch (error) {
      console.error("Get unread count error:", error);
      throw error;
    }
  }

  /**
   * Get last message with each friend
   */
  static async getLastMessagesWithFriends(userId) {
    try {
      const messages = await Message.aggregate([
        {
          $match: {
            $or: [{ senderId: userId }, { recipientId: userId }],
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$senderId", userId] },
                "$recipientId",
                "$senderId",
              ],
            },
            lastMessage: { $first: "$$ROOT" },
          },
        },
        {
          $sort: { "lastMessage.createdAt": -1 },
        },
      ]);

      return messages;
    } catch (error) {
      console.error("Get last messages error:", error);
      throw error;
    }
  }
}

export default MessageService;
