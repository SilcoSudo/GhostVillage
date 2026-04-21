import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accepted",
        "friend_rejected",
        "post_liked",
        "post_commented",
        "comment_replied",
        "report_processed",
        "ticket_replied",
        "announcement",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    i18n: {
      titleKey: {
        type: String,
        default: null,
      },
      titleParams: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      messageKey: {
        type: String,
        default: null,
      },
      messageParams: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    context: {
      type: [
        {
          labelKey: {
            type: String,
            default: null,
          },
          value: {
            type: String,
            default: null,
          },
        },
      ],
      default: [],
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["post", "comment", "friend", "ticket"],
        default: null,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
      link: {
        type: String,
        default: null,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
