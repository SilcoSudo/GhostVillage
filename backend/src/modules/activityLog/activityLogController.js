import ActivityLog from "./activityLogModel.js";

/**
 * Activity Log Controller
 * Xử lý logic cho Activity Log Management (Read-only)
 */

export const ActivityLogController = {
  /**
   * GET /api/activity-logs
   * Lấy danh sách activity logs với filter, search và pagination
   */
  getAllActivityLogs: async (req, res) => {
    try {
      const {
        page,
        limit,
        action,
        entityType,
        severity,
        userId,
        search,
        startDate,
        endDate,
      } = req.query;

      const result = await ActivityLog.getActivityLogs({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        action,
        entityType,
        severity,
        userId,
        search,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        message: "Lấy danh sách activity logs thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error in getAllActivityLogs:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách activity logs",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/activity-logs/stats/summary
   * Lấy thống kê tổng quan về activity logs
   */
  getActivityLogStats: async (req, res) => {
    try {
      const stats = await ActivityLog.getStats();

      res.status(200).json({
        success: true,
        message: "Lấy thống kê activity logs thành công",
        data: stats,
      });
    } catch (error) {
      console.error("Error in getActivityLogStats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê activity logs",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/activity-logs/:id
   * Lấy thông tin chi tiết một activity log
   */
  getActivityLogById: async (req, res) => {
    try {
      const { id } = req.params;

      const log = await ActivityLog.findById(id)
        .populate("userId", "username email avatar")
        .lean();

      if (!log) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy activity log với ID: ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Lấy thông tin activity log thành công",
        data: log,
      });
    } catch (error) {
      console.error("Error in getActivityLogById:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin activity log",
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/activity-logs/cleanup
   * Xóa logs cũ (older than X days) - Admin only
   */
  cleanupOldLogs: async (req, res) => {
    try {
      const { daysOld = 90 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await ActivityLog.deleteMany({
        createdAt: { $lt: cutoffDate },
        severity: { $ne: "CRITICAL" }, // Không xóa logs CRITICAL
      });

      res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} logs cũ hơn ${daysOld} ngày`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error in cleanupOldLogs:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa logs cũ",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/activity-logs/user/:userId
   * Lấy logs của một user cụ thể
   */
  getLogsByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await ActivityLog.getActivityLogs({
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.status(200).json({
        success: true,
        message: "Lấy logs của user thành công",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error in getLogsByUser:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy logs của user",
        error: error.message,
      });
    }
  },
};

/**
 * Helper: Log Activity (dùng trong các controllers khác)
 */
export const logActivity = async ({
  userId,
  username,
  action,
  entityType,
  entityId,
  entityName,
  description,
  severity = "LOW",
  metadata = {},
  req,
}) => {
  try {
    console.log("[ActivityLog] Logging activity:", {
      userId,
      username,
      action,
      entityType,
      entityId,
      entityName,
      description,
      severity,
    });

    await ActivityLog.createLog({
      userId,
      username,
      action,
      entityType,
      entityId,
      entityName,
      description,
      severity,
      metadata,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get("user-agent"),
    });

    console.log("[ActivityLog]  Activity logged successfully");
  } catch (error) {
    console.error(" Error logging activity:", error);
    // Don't throw - logging failure shouldn't break the main operation
  }
};
