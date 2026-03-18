import mongoose from "mongoose";

/**
 * Activity Log Schema
 * Lưu trữ logs của hệ thống (admin actions, errors, system events)
 */

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      comment: "User thực hiện hành động (nếu có)",
    },
    username: {
      type: String,
      comment: "Username của user (cached để query nhanh)",
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Admin Actions
        "CREATE",
        "UPDATE",
        "DELETE",
        "TOGGLE_STATUS",
        // User Actions
        "LOGIN",
        "LOGOUT",
        "REGISTER",
        // System Events
        "ERROR",
        "WARNING",
        "INFO",
        // Special Actions
        "BULK_UPDATE",
        "IMPORT",
        "EXPORT",
      ],
      index: true,
      comment: "Loại hành động",
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        "USER",
        "MONSTER",
        "MAP",
        "QUEST",
        "CONSUMABLE",
        "COSTUME",
        "MOON_EVENT",
        "ANNOUNCEMENT",
        "WIKI",
        "POST",
        "COMMENT",
        "SYSTEM",
      ],
      index: true,
      comment: "Loại entity bị tác động",
    },
    entityId: {
      type: String,
      comment: "ID của entity bị tác động",
    },
    entityName: {
      type: String,
      comment: "Tên của entity (cached)",
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
      comment: "Mô tả chi tiết hành động",
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
      index: true,
      comment: "Mức độ quan trọng",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      comment: "Thông tin bổ sung (data cũ/mới, error stack, etc.)",
    },
    ipAddress: {
      type: String,
      comment: "IP address của người thực hiện",
    },
    userAgent: {
      type: String,
      comment: "User agent string",
    },
  },
  {
    timestamps: true,
    collection: "activitylogs",
  }
);

// ========================
// INDEXES
// ========================
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, createdAt: -1 });
ActivityLogSchema.index({ severity: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

// ========================
// STATIC METHODS
// ========================

/**
 * Lấy danh sách activity logs với filter và pagination
 */
ActivityLogSchema.statics.getActivityLogs = async function ({
  page = 1,
  limit = 50,
  action,
  entityType,
  severity,
  userId,
  search,
  startDate,
  endDate,
} = {}) {
  const query = {};

  // Filters
  if (action && action !== "all") {
    query.action = action;
  }

  if (entityType && entityType !== "all") {
    query.entityType = entityType;
  }

  if (severity && severity !== "all") {
    query.severity = severity;
  }

  if (userId) {
    query.userId = userId;
  }

  // Date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Search
  if (search && search.trim() !== "") {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { entityName: { $regex: search, $options: "i" } },
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username email avatar")
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy thống kê tổng quan
 */
ActivityLogSchema.statics.getStats = async function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    todayCount,
    weekCount,
    byAction,
    byEntityType,
    bySeverity,
    errorCount,
  ] = await Promise.all([
    this.countDocuments({}),
    this.countDocuments({ createdAt: { $gte: today } }),
    this.countDocuments({ createdAt: { $gte: thisWeek } }),
    this.aggregate([
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $group: { _id: "$entityType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    this.countDocuments({ action: "ERROR" }),
  ]);

  return {
    total,
    today: todayCount,
    week: weekCount,
    errors: errorCount,
    byAction,
    byEntityType,
    bySeverity,
  };
};

/**
 * Helper: Tạo log mới
 */
ActivityLogSchema.statics.createLog = async function ({
  userId,
  username,
  action,
  entityType,
  entityId,
  entityName,
  description,
  severity = "LOW",
  metadata = {},
  ipAddress,
  userAgent,
}) {
  return this.create({
    userId,
    username,
    action,
    entityType,
    entityId,
    entityName,
    description,
    severity,
    metadata,
    ipAddress,
    userAgent,
  });
};

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);

export default ActivityLog;
