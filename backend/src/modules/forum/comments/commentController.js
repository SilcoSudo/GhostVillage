import * as commentService from "./commentService.js";
import NotificationService from "../notifications/notificationService.js";
import Post from "../posts/postModel.js";
import { evaluateReportWithGemini } from "../../../services/aiModerationService.js";

const isRateLimitedAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /googleusercontent\.com|ggpht\.com/i.test(url);
};

const buildReportReasonText = ({ reason, customReason }) => {
  const reasonCode = String(reason || "")
    .trim()
    .toUpperCase();
  const custom = String(customReason || "").trim();

  if (reasonCode === "OTHER") {
    return {
      reasonCode,
      reasonText: custom ? `Other: ${custom}` : "Other",
    };
  }

  return {
    reasonCode: reasonCode || "CUSTOM",
    reasonText: String(reason || "").trim(),
  };
};

const findExistingModerationByReason = (reports, reasonText) => {
  if (!Array.isArray(reports) || !reasonText) return null;

  const matched = reports.find(
    (item) => String(item?.reason || "").trim() === String(reasonText).trim(),
  );

  if (!matched?.aiModeration) return null;
  return matched.aiModeration;
};

const serializeComment = (comment, userId = null) => {
  const c = comment?.toObject ? comment.toObject() : comment;
  if (!c) return c;

  // Format author data
  let authorData = null;
  if (c.author) {
    if (typeof c.author === "object" && c.author.fullname) {
      authorData = {
        _id: c.author._id,
        username: c.author.fullname || "Anonymous User",
        avatarUrl:
          c.author.avatar && !isRateLimitedAvatarUrl(c.author.avatar)
            ? c.author.avatar
            : null,
      };
    } else {
      authorData = {
        _id: c.author._id || c.author,
        username: "Anonymous User",
        avatarUrl: null,
      };
    }
  }

  // Format replyTo data from populated parentId
  let replyToData = null;
  if (c.parentId && typeof c.parentId === "object" && c.parentId.author) {
    const parentAuthor = c.parentId.author;
    replyToData = {
      username:
        typeof parentAuthor === "object" && parentAuthor.fullname
          ? parentAuthor.fullname
          : "Anonymous User",
    };
  }

  // Check if current user has liked this comment
  const userLiked =
    userId && Array.isArray(c.likes)
      ? c.likes.some((likeId) => String(likeId) === String(userId))
      : false;

  return {
    _id: c._id,
    post: c.post,
    author: authorData,
    content: c.content,
    parentId: c.parentId?._id || c.parentId,
    replyTo: replyToData,
    likes: Array.isArray(c.likes) ? c.likes : [],
    userLiked,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { parentId } = req.query;
    const userId = req.user?._id || null;

    const comments = await commentService.getComments(postId, { parentId });

    return res.status(200).json({
      success: true,
      data: comments.map((c) => serializeComment(c, userId)),
    });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const authorId = req.user?._id || req.body.author;

    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no user",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const comment = await commentService.createComment({
      postId,
      authorId,
      content,
      parentId,
    });

    const userId = req.user?._id || null;

    // Send notification to post owner or comment owner
    try {
      const User = (await import("../../user/userModel.js")).default;
      const currentUser = await User.findById(authorId);
      const io = req.app.get("io");

      if (parentId) {
        // Reply to a comment - notify the parent comment author
        const parentComment = await commentService.getCommentById(parentId);
        if (
          parentComment &&
          String(parentComment.author) !== String(authorId)
        ) {
          await NotificationService.createCommentRepliedNotification(
            currentUser,
            parentComment.author,
            postId,
            parentId,
            io,
          );
        }
      } else {
        // Top-level comment - notify the post owner
        const post = await Post.findById(postId);
        if (post && String(post.author) !== String(authorId)) {
          await NotificationService.createPostCommentedNotification(
            currentUser,
            post.author,
            postId,
            io,
          );
        }
      }
    } catch (notifError) {
      console.error("Error sending comment notification:", notifError);
    }

    return res.status(201).json({
      success: true,
      data: serializeComment(comment, userId),
    });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no user",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const comment = await commentService.updateComment(
      commentId,
      userId,
      content,
    );

    return res.status(200).json({
      success: true,
      data: serializeComment(comment, userId),
    });
  } catch (err) {
    if (err.message === "Comment not found") {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message === "Not authorized to update this comment") {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no user",
      });
    }

    await commentService.deleteComment(commentId, userId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch (err) {
    if (err.message === "Comment not found") {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message === "Not authorized to delete this comment") {
      return res.status(403).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

export const reportComment = async (req, res, next) => {
  try {
    const { commentId, postId } = req.params;
    const effectiveUserId = (req.user && req.user._id) || req.body.userId;

    if (!effectiveUserId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no user",
      });
    }

    const normalizedReason = buildReportReasonText({
      reason: req.body.reason,
      customReason: req.body.customReason,
    });

    if (!normalizedReason.reasonText) {
      return res.status(400).json({
        success: false,
        message: "Report reason is required",
      });
    }

    const comment = await commentService.getCommentById(commentId);
    if (!comment || String(comment.post) !== String(postId)) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const alreadyReportedByUser = (comment.reports || []).some(
      (item) => String(item?.reporter) === String(effectiveUserId),
    );

    if (alreadyReportedByUser) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this comment",
      });
    }

    const existingModeration = findExistingModerationByReason(
      comment.reports,
      normalizedReason.reasonText,
    );

    let aiModeration = existingModeration;
    if (!aiModeration) {
      const uniqueReporterCount = new Set(
        (comment.reports || [])
          .map((item) => String(item?.reporter))
          .filter(Boolean),
      ).size;

      aiModeration = await evaluateReportWithGemini({
        postText: comment.content || "",
        reportReason: normalizedReason.reasonText,
        reportCountUniqueUsers: uniqueReporterCount + 1,
      });
    }

    const reportPayload = {
      reporter: effectiveUserId,
      reason: normalizedReason.reasonText,
      aiModeration,
      createdAt: new Date(),
    };

    const saveResult = await commentService.addCommentReport(
      commentId,
      reportPayload,
    );

    if (!saveResult) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (saveResult.duplicated) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this comment",
      });
    }

    try {
      const io = req.app.get("io");
      await NotificationService.createReportProcessedNotification(
        effectiveUserId,
        postId,
        normalizedReason.reasonCode,
        aiModeration,
        io,
      );
    } catch (notificationError) {
      console.error(
        "Error sending comment report processed notification:",
        notificationError,
      );
    }

    return res.status(200).json({
      success: true,
      message: existingModeration
        ? "Comment report submitted (reused existing AI evaluation)"
        : "Comment report submitted",
      data: {
        commentId: saveResult.comment._id,
        isHiddenByModeration: Boolean(saveResult.comment.isHiddenByModeration),
        report: Array.isArray(saveResult.comment.reports)
          ? saveResult.comment.reports.length
          : 0,
        reports: Array.isArray(saveResult.comment.reports)
          ? saveResult.comment.reports
          : [],
        reasonCode: normalizedReason.reasonCode,
        aiModeration,
      },
    });
  } catch (err) {
    next(err);
  }
};
