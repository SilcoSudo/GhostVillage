import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000,
  },
  attachments: [
    {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
  ],
  status: {
    type: String,
    enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    default: "OPEN",
    index: true,
  },
  adminReplies: [
    {
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      repliedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, createdAt: -1 });

SupportTicketSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const SupportTicket = mongoose.model("SupportTicket", SupportTicketSchema);

export default SupportTicket;
