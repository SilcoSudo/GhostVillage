import Notification from "./notificationModel.js";
import Post from "../posts/postModel.js";
import Comment from "../comments/commentModel.js";

const getDisplayName = (user, fallback = "Someone") => {
  return user?.fullname || user?.username || user?.email || fallback;
};

const CONTEXT_SNIPPET_MAX_LENGTH = 100;

const normalizeText = (value, maxLength = CONTEXT_SNIPPET_MAX_LENGTH) => {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

const createContextLine = (labelKey, value, maxLength) => {
  const normalizedValue = normalizeText(value, maxLength);
  if (!normalizedValue) {
    return null;
  }

  return {
    labelKey,
    value: normalizedValue,
  };
};

const createContextLines = (...lines) => lines.filter(Boolean);

const formatDurationLabel = (totalSeconds) => {
  const seconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  if (seconds <= 0) return "";

  const hours = Math.max(1, Math.ceil(seconds / 3600));
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
};

const getPenaltyDurationSeconds = (moderationPenalty) => {
  if (!moderationPenalty) return 0;

  const mutedUntil = moderationPenalty?.mutedUntil
    ? new Date(moderationPenalty.mutedUntil)
    : null;

  if (mutedUntil && !Number.isNaN(mutedUntil.getTime())) {
    const remainingSeconds = Math.ceil(
      (mutedUntil.getTime() - Date.now()) / 1000,
    );
    if (remainingSeconds > 0) {
      return remainingSeconds;
    }
  }

  const lockSeconds = Number(moderationPenalty?.lockSeconds);
  return Number.isFinite(lockSeconds) && lockSeconds > 0
    ? Math.ceil(lockSeconds)
    : 0;
};

const fetchPostContextLines = async (postId) => {
  if (!postId) {
    return [];
  }

  const post = await Post.findById(postId).select("title").lean();
  if (!post) {
    return [];
  }

  return createContextLines(
    createContextLine("notifications.contexts.post", post.title, 90),
  );
};

const fetchCommentContextLines = async (commentId) => {
  if (!commentId) {
    return [];
  }

  const comment = await Comment.findById(commentId)
    .select("content post")
    .populate("post", "title")
    .lean();

  if (!comment) {
    return [];
  }

  return createContextLines(
    createContextLine("notifications.contexts.post", comment.post?.title, 90),
    createContextLine("notifications.contexts.comment", comment.content, 120),
  );
};

const fetchEntityContextLines = async (entityType, entityId) => {
  if (String(entityType || "").toLowerCase() === "comment") {
    return fetchCommentContextLines(entityId);
  }

  return fetchPostContextLines(entityId);
};

const createI18nPayload = ({
  titleKey = null,
  titleParams = {},
  messageKey = null,
  messageParams = {},
} = {}) => ({
  titleKey,
  titleParams,
  messageKey,
  messageParams,
});

const buildSocketNotification = (notification) => ({
  id: notification._id,
  title: notification.title,
  message: notification.message,
  type: notification.type,
  link: notification.relatedEntity?.link || null,
  i18n: notification.i18n || null,
  context: notification.context || [],
});

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
        message: `${getDisplayName(userA)} gửi lời mời kết bạn`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.friendRequest.title",
          messageKey: "notifications.items.friendRequest.message",
          messageParams: {
            name: getDisplayName(userA),
          },
        }),
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "friend",
          entityId: friendshipId,
          link: `/profile/${userA._id}`,
        },
      });

      // Gửi realtime nếu user online
      if (io) {
        io.to(`user:${userB._id}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
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
        message: `${getDisplayName(userA)} đã chấp nhận lời mời kết bạn`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.friendAccepted.title",
          messageKey: "notifications.items.friendAccepted.message",
          messageParams: {
            name: getDisplayName(userA),
          },
        }),
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "friend",
          entityId: userA._id,
          link: `/profile/${userA._id}`,
        },
      });

      if (io) {
        io.to(`user:${userB._id}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
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
        message: `${getDisplayName(userA)} đã từ chối lời mời kết bạn`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.friendRejected.title",
          messageKey: "notifications.items.friendRejected.message",
          messageParams: {
            name: getDisplayName(userA),
          },
        }),
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "friend",
          entityId: friendshipId,
          link: `/profile/${userA._id}`,
        },
      });

      if (io) {
        io.to(`user:${userB._id}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
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
      const context = await fetchPostContextLines(postId);
      const notification = await Notification.create({
        userId: postOwnerId,
        type: "post_liked",
        title: "Thích bài viết",
        message: `${getDisplayName(userA)} đã thích bài viết của bạn`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.postLiked.title",
          messageKey: "notifications.items.postLiked.message",
          messageParams: {
            name: getDisplayName(userA),
          },
        }),
        context,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "post",
          entityId: postId,
          link: `/post/${postId}`,
        },
      });

      if (io) {
        io.to(`user:${postOwnerId}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
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
      const context = await fetchPostContextLines(postId);
      const notification = await Notification.create({
        userId: postOwnerId,
        type: "post_commented",
        title: "Bình luận bài viết",
        message: `${getDisplayName(userA)} đã bình luận bài viết của bạn`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.postCommented.title",
          messageKey: "notifications.items.postCommented.message",
          messageParams: {
            name: getDisplayName(userA),
          },
        }),
        context,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "post",
          entityId: postId,
          link: `/post/${postId}`,
        },
      });

      if (io) {
        io.to(`user:${postOwnerId}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
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
      const context = await fetchEntityContextLines(entityTypeLabel, entityId);
      const reporterMessage =
        label === "no_violation"
          ? "Thanks for your report. We reviewed the content and did not find a clear violation at this time."
          : reporterMessageByAction[action] ||
            "Thanks for your report. We reviewed the case and handled it under community guidelines.";
      const reporterMessageKey =
        label === "no_violation"
          ? "notifications.items.reportProcessed.reporter.keep.message"
          : "notifications.items.reportProcessed.reporter.remove.message";

      const createdNotifications = [];

      const reporterNotification = await Notification.create({
        userId: reporterId,
        type: "report_processed",
        title: "Report Update",
        message: reporterMessage,
        i18n: createI18nPayload({
          titleKey: "notifications.items.reportProcessed.reporter.title",
          messageKey: reporterMessageKey,
          messageParams: {
            entityType: entityTypeLabel,
          },
        }),
        context,
        relatedEntity: {
          entityType: entityTypeLabel,
          entityId,
          link,
        },
      });
      createdNotifications.push(reporterNotification);

      if (io) {
        io.to(`user:${reporterId}`).emit(
          "new_notification",
          buildSocketNotification(reporterNotification),
        );
      }

      if (reportedUserId && String(reportedUserId) !== String(reporterId)) {
        const reportedContext = context;
        const durationSeconds = getPenaltyDurationSeconds(moderationPenalty);
        const durationLabel = formatDurationLabel(durationSeconds);
        const penaltyMessage =
          moderationPenalty?.penaltyType === "warning"
            ? "A reminder has been applied to your account in line with community guidelines."
            : moderationPenalty?.penaltyType === "mute"
              ? durationLabel
                ? `Your account is temporarily restricted from posting and commenting for ${durationLabel}.`
                : "Your account is temporarily restricted from posting and commenting."
              : moderationPenalty?.penaltyType === "merged_hide_only"
                ? "Some of your content visibility has been limited to protect the community."
                : "Please follow community guidelines to avoid stricter moderation actions.";

        const reviewedMessage =
          label === "no_violation"
            ? "Your content was reviewed and no clear violation was found at this time."
            : `Your ${entityTypeLabel} was reviewed under community guidelines.`;
        const reportedMessageKey =
          moderationPenalty?.penaltyType === "warning"
            ? "notifications.items.reportProcessed.moderationNotice.warning"
            : moderationPenalty?.penaltyType === "mute"
              ? "notifications.items.reportProcessed.moderationNotice.mute"
              : moderationPenalty?.penaltyType === "merged_hide_only"
                ? "notifications.items.reportProcessed.moderationNotice.mergedHideOnly"
                : label === "no_violation"
                  ? "notifications.items.reportProcessed.moderationNotice.noViolation"
                  : "notifications.items.reportProcessed.moderationNotice.default";

        const reportedUserNotification = await Notification.create({
          userId: reportedUserId,
          type: "report_processed",
          title: "Moderation Notice",
          message: `${reviewedMessage} ${penaltyMessage}`,
          i18n: createI18nPayload({
            titleKey:
              "notifications.items.reportProcessed.moderationNotice.title",
            messageKey: reportedMessageKey,
            messageParams: {
              entityType: entityTypeLabel,
              ...(durationSeconds > 0 ? { durationSeconds } : {}),
            },
          }),
          context: reportedContext,
          relatedEntity: {
            entityType: entityTypeLabel,
            entityId,
            link,
          },
        });
        createdNotifications.push(reportedUserNotification);

        if (io) {
          io.to(`user:${reportedUserId}`).emit(
            "new_notification",
            buildSocketNotification(reportedUserNotification),
          );
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
      const context = await fetchEntityContextLines(entityTypeLabel, entityId);
      const message = normalizedReason
        ? `Your ${entityTypeLabel} has been restored by ${moderatorName}. Moderator note: "${normalizedReason}"`
        : `Your ${entityTypeLabel} has been restored by ${moderatorName}.`;

      const notification = await Notification.create({
        userId: restoredUserId,
        type: "report_processed",
        title: "Content Restored",
        message,
        i18n: createI18nPayload({
          titleKey: "notifications.items.contentRestored.title",
          messageKey: normalizedReason
            ? "notifications.items.contentRestored.messageWithNote"
            : "notifications.items.contentRestored.message",
          messageParams: {
            entityType: entityTypeLabel,
            moderatorName,
            recoveryReason: normalizedReason,
          },
        }),
        context,
        relatedUser: moderatorUser?._id || null,
        relatedEntity: {
          entityType: entityTypeLabel,
          entityId,
          link: entityLink || `/post/${entityId}`,
        },
      });

      if (io) {
        io.to(`user:${restoredUserId}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
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
      const context = await fetchCommentContextLines(commentId);
      const notification = await Notification.create({
        userId: commentOwnerId,
        type: "comment_replied",
        title: "Trả lời bình luận",
        message: `${getDisplayName(userA)} đã trả lời bình luận của bạn`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.commentReplied.title",
          messageKey: "notifications.items.commentReplied.message",
          messageParams: {
            name: getDisplayName(userA),
          },
        }),
        context,
        relatedUser: userA._id,
        relatedEntity: {
          entityType: "comment",
          entityId: commentId,
          link: `/post/${postId}#comment-${commentId}`,
        },
      });

      if (io) {
        io.to(`user:${commentOwnerId}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
      }

      return notification;
    } catch (error) {
      console.error("Error creating comment replied notification:", error);
      throw error;
    }
  }

  static async createTicketRepliedNotification(
    { ticketOwnerId, adminUser = null, ticketId, subject = "", content = "" },
    io,
  ) {
    try {
      if (!ticketOwnerId || !ticketId) return null;

      const adminName =
        adminUser?.fullname ||
        adminUser?.username ||
        adminUser?.email ||
        "Admin";
      const normalizedContent = String(content || subject || "").trim();
      const context = createContextLines(
        createContextLine(
          "notifications.contexts.content",
          normalizedContent,
          120,
        ),
      );

      const notification = await Notification.create({
        userId: ticketOwnerId,
        type: "ticket_replied",
        title: "Support Ticket Updated",
        message: `${adminName} replied to your support ticket.`,
        i18n: createI18nPayload({
          titleKey: "notifications.items.ticketReplied.title",
          messageKey: "notifications.items.ticketReplied.message",
          messageParams: {
            name: adminName,
          },
        }),
        context,
        relatedUser: adminUser?._id || null,
        relatedEntity: {
          entityType: "ticket",
          entityId: ticketId,
          link: "/support/ticket",
        },
      });

      if (io) {
        io.to(`user:${ticketOwnerId}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
      }

      return notification;
    } catch (error) {
      console.error("Error creating ticket replied notification:", error);
      throw error;
    }
  }

  /**
   * Tạo notification khi admin gỡ mute cho tài khoản
   */
  static async createAccountUnmutedNotification(
    { userId, adminUser = null },
    io,
  ) {
    try {
      if (!userId) return null;

      const moderatorName = getDisplayName(adminUser, "Admin");
      const notification = await Notification.create({
        userId,
        type: "report_processed",
        title: "Account Unmuted",
        message: `Your account has been unmuted by ${moderatorName}. You can post and comment again.`,
        relatedUser: adminUser?._id || null,
      });

      if (io) {
        io.to(`user:${userId}`).emit(
          "new_notification",
          buildSocketNotification(notification),
        );
      }

      return notification;
    } catch (error) {
      console.error("Error creating account unmuted notification:", error);
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

  /**
   * Xóa notification friend_request gốc theo friendshipId và người nhận
   */
  static async deleteFriendRequestNotification(friendshipId, recipientUserId) {
    try {
      if (!friendshipId || !recipientUserId) {
        return { deletedCount: 0 };
      }

      const result = await Notification.deleteMany({
        userId: recipientUserId,
        type: "friend_request",
        "relatedEntity.entityId": friendshipId,
      });

      return result;
    } catch (error) {
      console.error("Error deleting friend request notification:", error);
      return { deletedCount: 0 };
    }
  }
}

export default NotificationService;
