import NotificationService from "./notificationService.js";

/**
 * Get all notifications for current user
 * GET /api/web/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    const result = await NotificationService.getUserNotifications(
      req.user._id,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
};

/**
 * Get unread notifications
 * GET /api/web/notifications/unread
 */
export const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await NotificationService.getUnreadNotifications(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Get unread notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread notifications",
    });
  }
};

/**
 * Get unread count
 * GET /api/web/notifications/unread/count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user._id);

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/web/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await NotificationService.markAsRead(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/web/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user._id);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

/**
 * Delete notification
 * DELETE /api/web/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await NotificationService.deleteNotification(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

/**
 * Delete all notifications
 * DELETE /api/web/notifications
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const result = await NotificationService.deleteAllNotifications(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete all notifications",
    });
  }
};
