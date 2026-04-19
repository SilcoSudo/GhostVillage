import Notification from "./notificationModel.js";

class NotificationService {
  /**
   * Tạo notification friend request
   * User A gửi lời mời kết bạn cho User B
   */
  static async createFriendRequestNotification(userA, userB, friendshipId, io) {
    try {
      const notification = await Notification.create({
        userId: userB._id,
        type: "friend_request",
        title: "Lời mời kết bạn",
        message: `${userA.fullname} gửi lời mời kết bạn`,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "friend",
          entityId: friendshipId,
          link: `/profile/${userA._id}`,
        },
      });

      // Gửi realtime nếu user online
      if (io) {
        io.to(`user:${userB._id}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity.link,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating friend request notification:", error);
      throw error;
    }
  }

  /**
   * Tạo notification chấp nhận lời mời kết bạn
   */
  static async createFriendAcceptedNotification(userA, userB, io) {
    try {
      const notification = await Notification.create({
        userId: userB._id,
        type: "friend_accepted",
        title: "Chấp nhận lời mời kết bạn",
        message: `${userA.fullname} đã chấp nhận lời mời kết bạn`,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "friend",
          entityId: userA._id,
          link: `/profile/${userA._id}`,
        },
      });

      if (io) {
        io.to(`user:${userB._id}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating friend accepted notification:", error);
      throw error;
    }
  }

  /**
   * Tạo notification từ chối lời mời kết bạn
   */
  static async createFriendRejectedNotification(
    userA,
    userB,
    friendshipId,
    io,
  ) {
    try {
      const notification = await Notification.create({
        userId: userB._id,
        type: "friend_rejected",
        title: "Từ chối lời mời kết bạn",
        message: `${userA.fullname} đã từ chối lời mời kết bạn`,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "friend",
          entityId: friendshipId,
          link: `/profile/${userA._id}`,
        },
      });

      if (io) {
        io.to(`user:${userB._id}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity.link,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating friend rejected notification:", error);
      throw error;
    }
  }

  /**
   * Tạo notification like post
   */
  static async createPostLikedNotification(userA, postOwnerId, postId, io) {
    try {
      const notification = await Notification.create({
        userId: postOwnerId,
        type: "post_liked",
        title: "Thích bài viết",
        message: `${userA.fullname} đã thích bài viết của bạn`,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "post",
          entityId: postId,
          link: `/post/${postId}`,
        },
      });

      if (io) {
        io.to(`user:${postOwnerId}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity.link,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating post liked notification:", error);
      throw error;
    }
  }

  /**
   * Tạo notification comment post
   */
  static async createPostCommentedNotification(userA, postOwnerId, postId, io) {
    try {
      const notification = await Notification.create({
        userId: postOwnerId,
        type: "post_commented",
        title: "Bình luận bài viết",
        message: `${userA.fullname} đã bình luận bài viết của bạn`,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "post",
          entityId: postId,
          link: `/post/${postId}`,
        },
      });

      if (io) {
        io.to(`user:${postOwnerId}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity.link,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating post commented notification:", error);
      throw error;
    }
  }

  static async createReportProcessedNotification(
    reporterId,
    entityId,
    reasonCode,
    aiModeration,
    io,
    options = {},
  ) {
    try {
      const {
        reportedUserId = null,
        entityType = "post",
        moderationPenalty = null,
        entityLink = null,
      } = options;

      const label = String(aiModeration?.label || "no_violation").toLowerCase();
      const action = label === "no_violation" ? "keep" : "remove";

      const reporterMessageByAction = {
        keep: "Thanks for your report. We reviewed the content and no further action is needed right now.",
        remove:
          "Thanks for your report. We reviewed the content and removed it under community guidelines.",
      };

      const entityTypeLabel = entityType === "comment" ? "comment" : "post";
      const link = entityLink || `/post/${entityId}`;
      const reporterMessage =
        label === "no_violation"
          ? "Thanks for your report. We reviewed the content and did not find a clear violation at this time."
          : reporterMessageByAction[action] ||
            "Thanks for your report. We reviewed the case and handled it under community guidelines.";

      const createdNotifications = [];

      const reporterNotification = await Notification.create({
        userId: reporterId,
        type: "report_processed",
        title: "Report Update",
        message: reporterMessage,
        relatedEntity: {
          entityType: entityTypeLabel,
          entityId,
          link,
        },
      });
      createdNotifications.push(reporterNotification);

      if (io) {
        io.to(`user:${reporterId}`).emit("new_notification", {
          id: reporterNotification._id,
          title: reporterNotification.title,
          message: reporterNotification.message,
          type: reporterNotification.type,
          link: reporterNotification.relatedEntity.link,
        });
      }

      if (reportedUserId && String(reportedUserId) !== String(reporterId)) {
        const penaltyMessage =
          moderationPenalty?.penaltyType === "warning"
            ? "A reminder has been applied to your account in line with community guidelines."
            : moderationPenalty?.penaltyType === "mute"
              ? "Your account is temporarily restricted from posting and commenting."
              : moderationPenalty?.penaltyType === "merged_hide_only"
                ? "Some of your content visibility has been limited to protect the community."
                : "Please follow community guidelines to avoid stricter moderation actions.";

        const reviewedMessage =
          label === "no_violation"
            ? "Your content was reviewed and no clear violation was found at this time."
            : `Your ${entityTypeLabel} was reviewed under community guidelines.`;

        const reportedUserNotification = await Notification.create({
          userId: reportedUserId,
          type: "report_processed",
          title: "Moderation Notice",
          message: `${reviewedMessage} ${penaltyMessage}`,
          relatedEntity: {
            entityType: entityTypeLabel,
            entityId,
            link,
          },
        });
        createdNotifications.push(reportedUserNotification);

        if (io) {
          io.to(`user:${reportedUserId}`).emit("new_notification", {
            id: reportedUserNotification._id,
            title: reportedUserNotification.title,
            message: reportedUserNotification.message,
            type: reportedUserNotification.type,
            link: reportedUserNotification.relatedEntity.link,
          });
        }
      }

      return createdNotifications;
    } catch (error) {
      console.error("Error creating report processed notification:", error);
      throw error;
    }
  }

  static async createContentRestoredNotification(
    {
      restoredUserId,
      moderatorUser = null,
      entityType = "post",
      entityId,
      entityLink,
      recoveryReason = "",
    },
    io,
  ) {
    try {
      if (!restoredUserId || !entityId) return null;

      const entityTypeLabel = entityType === "comment" ? "comment" : "post";
      const moderatorName =
        moderatorUser?.fullname || moderatorUser?.username || "Admin";
      const normalizedReason = String(recoveryReason || "").trim();
      const message = normalizedReason
        ? `Your ${entityTypeLabel} has been restored by ${moderatorName}. Moderator note: "${normalizedReason}"`
        : `Your ${entityTypeLabel} has been restored by ${moderatorName}.`;

      const notification = await Notification.create({
        userId: restoredUserId,
        type: "report_processed",
        title: "Content Restored",
        message,
        relatedUser: moderatorUser?._id || null,
        relatedEntity: {
          entityType: entityTypeLabel,
          entityId,
          link: entityLink || `/post/${entityId}`,
        },
      });

      if (io) {
        io.to(`user:${restoredUserId}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity.link,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating content restored notification:", error);
      throw error;
    }
  }

  /**
   * Tạo notification comment reply
   */
  static async createCommentRepliedNotification(
    userA,
    commentOwnerId,
    postId,
    commentId,
    io,
  ) {
    try {
      const notification = await Notification.create({
        userId: commentOwnerId,
        type: "comment_replied",
        title: "Trả lời bình luận",
        message: `${userA.fullname} đã trả lời bình luận của bạn`,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "comment",
          entityId: commentId,
          link: `/post/${postId}#comment-${commentId}`,
        },
      });

      if (io) {
        io.to(`user:${commentOwnerId}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity.link,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating comment replied notification:", error);
      throw error;
    }
  }

  static async createTicketRepliedNotification(
    { ticketOwnerId, adminUser = null, ticketId, subject = "" },
    io,
  ) {
    try {
      if (!ticketOwnerId || !ticketId) return null;

      const adminName =
        adminUser?.fullname ||
        adminUser?.username ||
        adminUser?.email ||
        "Admin";
      const normalizedSubject = String(subject || "").trim();
      const ticketSuffix = normalizedSubject ? `: "${normalizedSubject}"` : "";

      const notification = await Notification.create({
        userId: ticketOwnerId,
        type: "ticket_replied",
        title: "Support Ticket Updated",
        message: `${adminName} replied to your support ticket${ticketSuffix}.`,
        relatedUser: adminUser?._id || null,
        relatedEntity: {
          entityType: "ticket",
          entityId: ticketId,
          link: "/support/ticket",
        },
      });

      if (io) {
        io.to(`user:${ticketOwnerId}`).emit("new_notification", {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.relatedEntity?.link || "/support/ticket",
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating ticket replied notification:", error);
      throw error;
    }
  }

  /**
   * Tạo announcement cho tất cả users
   */
  static async createAnnouncementNotification(title, message, io) {
    try {
      const User = (await import("../../user/userModel.js")).default;
      const allUsers = await User.find({}, "_id");

      const notifications = allUsers.map((user) => ({
        userId: user._id,
        type: "announcement",
        title: title,
        message: message,
        relatedEntity: {
          entityType: null,
          link: `/announcements`,
        },
      }));

      await Notification.insertMany(notifications);

      // Broadcast realtime
      if (io) {
        io.emit("new_announcement", {
          title: title,
          message: message,
        });
      }

      return notifications.length;
    } catch (error) {
      console.error("Error creating announcement notification:", error);
      throw error;
    }
  }

  /**
   * Lấy tất cả notification của user
   */
  static async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("relatedUser", "fullname avatar");

      const total = await Notification.countDocuments({ userId });

      return {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  /**
   * Lấy notification chưa đọc
   */
  static async getUnreadNotifications(userId) {
    try {
      const notifications = await Notification.find({
        userId,
        isRead: false,
      })
        .sort({ createdAt: -1 })
        .populate("relatedUser", "fullname avatar");

      return notifications;
    } catch (error) {
      console.error("Error getting unread notifications:", error);
      throw error;
    }
  }

  /**
   * Lấy số lượng notification chưa đọc
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });
      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu notification đã đọc
   */
  static async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true },
      );

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu tất cả notification đã đọc
   */
  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        {
          isRead: true,
          readAt: new Date(),
        },
      );

      return result;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Xóa notification
   */
  static async deleteNotification(notificationId) {
    try {
      const result = await Notification.findByIdAndDelete(notificationId);
      return result;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Xóa tất cả notification của user
   */
  static async deleteAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({ userId });
      return result;
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      throw error;
    }
  }
}

export default NotificationService;
