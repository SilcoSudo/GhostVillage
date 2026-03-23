import * as postService from "./postService.js";
import NotificationService from "../notifications/notificationService.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../../services/uploadService.js";
import { evaluateReportWithGemini } from "../../../services/aiModerationService.js";
import {
  applyProgressiveModerationPenalty,
  getUserPostingRestriction,
  isAIViolation,
} from "../../../services/moderationPenaltyService.js";

const isRateLimitedAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /googleusercontent\.com|ggpht\.com/i.test(url);
};

const MAX_POST_IMAGES = 10;
const MAX_POST_VIDEOS = 1;

const validatePostMediaLimits = (media) => {
  if (!Array.isArray(media)) return null;

  const imageCount = media.filter((item) => item?.type === "image").length;
  const videoCount = media.filter((item) => item?.type === "video").length;

  if (videoCount > MAX_POST_VIDEOS) {
    return `A post can contain up to ${MAX_POST_VIDEOS} video.`;
  }

  if (imageCount > MAX_POST_IMAGES) {
    return `A post can contain up to ${MAX_POST_IMAGES} images.`;
  }

  return null;
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

const serializePost = (doc) => {
  const p = doc?.toObject ? doc.toObject() : doc;
  if (!p) return p;

  // Format author data
  // Post.author now directly references User model
  let authorData = null;
  if (p.author) {
    // Handle case where author is populated (User object)
    if (typeof p.author === "object" && p.author.fullname) {
      const user = p.author;
      authorData = {
        _id: user._id,
        username: user.fullname || "Anonymous User",
        fullname: user.fullname || "Anonymous User",
        avatar:
          user.avatar && !isRateLimitedAvatarUrl(user.avatar)
            ? user.avatar
            : null,
      };
    }
    // Handle case where author is just an ID (old data or not populated)
    else {
      authorData = {
        _id: p.author._id || p.author,
        username: "Anonymous User",
        fullname: "Anonymous User",
        avatar: null,
      };
    }
  }

  return {
    ...p,
    author: authorData,
    likes: Array.isArray(p.likes) ? p.likes : [],
    reports: Array.isArray(p.reports) ? p.reports : [],
    report: Array.isArray(p.reports) ? p.reports.length : 0,
    commentCount: p.commentCount || 0,
  };
};

export const listPosts = async (req, res, next) => {
  try {
    const { page, limit, category, reportedOnly, hiddenOnly } = req.query;
    const { items, pagination } = await postService.listPosts({
      page,
      limit,
      category,
      reportedOnly:
        String(reportedOnly).toLowerCase() === "true" || reportedOnly === "1",
      hiddenOnly:
        String(hiddenOnly).toLowerCase() === "true" || hiddenOnly === "1",
    });
    return res.status(200).json({
      success: true,
      data: { posts: items.map(serializePost), pagination },
    });
  } catch (err) {
    next(err);
  }
};

export const getPost = async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({ success: true, data: serializePost(post) });
  } catch (err) {
    next(err);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, body, author, category, media } = req.body;
    const effectiveAuthor = author || (req.user && req.user._id) || undefined;

    if (!effectiveAuthor) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no user",
      });
    }

    const postingRestriction = await getUserPostingRestriction({
      userId: effectiveAuthor,
    });
    if (!postingRestriction.allowed) {
      return res.status(postingRestriction.statusCode || 403).json({
        success: false,
        message: postingRestriction.message,
        data: {
          mutedUntil: postingRestriction.mutedUntil || null,
          remainingSeconds: postingRestriction.remainingSeconds || 0,
        },
      });
    }

    if (!title || !body) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const mediaValidationError = validatePostMediaLimits(media);
    if (mediaValidationError) {
      return res
        .status(400)
        .json({ success: false, message: mediaValidationError });
    }

    const created = await postService.createPost({
      title,
      body,
      author: effectiveAuthor,
      category,
      media,
    });
    return res
      .status(201)
      .json({ success: true, data: serializePost(created) });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { title, body, category, media } = req.body;

    const mediaValidationError = validatePostMediaLimits(media);
    if (mediaValidationError) {
      return res
        .status(400)
        .json({ success: false, message: mediaValidationError });
    }

    const updated = await postService.updatePost(req.params.id, {
      title,
      body,
      category,
      media,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res
      .status(200)
      .json({ success: true, data: serializePost(updated) });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const deleted = await postService.deletePost(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({ success: true, message: "Post deleted" });
  } catch (err) {
    next(err);
  }
};

export const restorePost = async (req, res, next) => {
  try {
    const recoveryReason = String(req.body?.recoveryReason || "")
      .trim()
      .slice(0, 500);
    const restored = await postService.restoreHiddenPost(req.params.id);
    if (!restored) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const restoredUserId = restored?.author?._id || restored?.author || null;
    if (
      restoredUserId &&
      String(restoredUserId) !== String(req.user?._id || "")
    ) {
      try {
        const io = req.app.get("io");
        await NotificationService.createContentRestoredNotification(
          {
            restoredUserId,
            moderatorUser: req.user,
            entityType: "post",
            entityId: restored._id,
            entityLink: `/post/${restored._id}`,
            recoveryReason,
          },
          io,
        );
      } catch (notificationError) {
        console.error(
          "Error sending post restored notification:",
          notificationError,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Post restored",
      data: {
        postId: restored._id,
        isTemporarilyHidden: Boolean(restored.isTemporarilyHidden),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const likePost = async (req, res, next) => {
  try {
    const effectiveUserId = (req.user && req.user._id) || req.body.userId;
    if (!effectiveUserId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no user" });
    }
    const post = await postService.toggleLike(req.params.id, effectiveUserId);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    // Check if user just added a like (not removed)
    const isLiked =
      post.likes.findIndex((x) => String(x) === String(effectiveUserId)) >= 0;

    // Send notification if user just liked and they're not the post owner
    if (isLiked && String(post.author) !== String(effectiveUserId)) {
      try {
        const User = (await import("../../user/userModel.js")).default;
        const currentUser = await User.findById(effectiveUserId);
        const io = req.app.get("io");

        await NotificationService.createPostLikedNotification(
          currentUser,
          post.author,
          post._id,
          io,
        );
      } catch (notifError) {
        console.error("Error sending like notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    return res.status(200).json({
      success: true,
      data: { likes: Array.isArray(post.likes) ? post.likes.length : 0 },
    });
  } catch (err) {
    next(err);
  }
};

export const bookmarkPost = async (req, res, next) => {
  try {
    const effectiveUserId = (req.user && req.user._id) || req.body.userId;
    if (!effectiveUserId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no user" });
    }
    const post = await postService.toggleBookmark(
      req.params.id,
      effectiveUserId,
    );
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({
      success: true,
      data: {
        bookmarks: Array.isArray(post.bookmarks) ? post.bookmarks.length : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const lockPost = async (req, res, next) => {
  try {
    const post = await postService.toggleLockPost(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }
    return res.status(200).json({
      success: true,
      data: { isLocked: post.isLocked },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadPostMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No media file provided",
      });
    }

    const mimeType = req.file.mimetype || "";
    const isVideo = mimeType.startsWith("video/");
    const maxVideoSizeBytes = 20 * 1024 * 1024;

    if (isVideo && req.file.size > maxVideoSizeBytes) {
      return res.status(400).json({
        success: false,
        message: "Video file is too large. Maximum allowed size is 20MB.",
      });
    }

    const uploadOptions = isVideo
      ? {
          folder: "ghostvillage/posts",
          resource_type: "video",
          timeout: 600000,
          transformation: [{ width: 1280, height: 720, crop: "limit" }],
        }
      : {
          folder: "ghostvillage/posts",
          resource_type: "image",
          transformation: [
            { width: 1920, height: 1080, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ],
          flags: "progressive",
        };

    // Upload to Cloudinary with optimizations
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      uploadOptions,
    );

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      },
    });
  } catch (err) {
    console.error("Upload post media error:", err);
    const message = err?.message || "Upload failed";
    if (message.includes("status 429") || message.includes("429")) {
      return res.status(429).json({
        success: false,
        message:
          "Cloudinary is rate limiting uploads right now. Please wait a moment and try again.",
      });
    }
    if (
      message.includes("status 499") ||
      message.includes("Timeout") ||
      err?.statusCode === 499
    ) {
      return res.status(503).json({
        success: false,
        message:
          "Video upload timed out at media server. Please try a smaller file or try again in a moment.",
      });
    }
    next(err);
  }
};

export const deletePostMedia = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "publicId is required",
      });
    }

    const result = await deleteFromCloudinary(publicId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Delete post media error:", err);
    next(err);
  }
};

export const reportPost = async (req, res, next) => {
  try {
    const effectiveUserId = (req.user && req.user._id) || req.body.userId;
    if (!effectiveUserId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no user" });
    }

    const normalizedReason = buildReportReasonText({
      reason: req.body.reason,
      customReason: req.body.customReason,
    });

    if (!normalizedReason.reasonText) {
      return res
        .status(400)
        .json({ success: false, message: "Report reason is required" });
    }

    const post = await postService.getPostById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const alreadyReported = (post.reports || []).some(
      (item) => String(item?.reporter) === String(effectiveUserId),
    );

    if (alreadyReported) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this post",
      });
    }

    const existingModeration = findExistingModerationByReason(
      post.reports,
      normalizedReason.reasonText,
    );

    let aiModeration = existingModeration;

    if (!aiModeration) {
      const uniqueReporterCount = new Set(
        (post.reports || [])
          .map((item) => String(item?.reporter))
          .filter(Boolean),
      ).size;

      aiModeration = await evaluateReportWithGemini({
        postText: `${post.title || ""}\n${post.body || ""}`,
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

    const saveResult = await postService.addPostReport(
      req.params.id,
      reportPayload,
    );

    if (!saveResult) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (saveResult.duplicated) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this post",
      });
    }

    let moderationPenalty = null;
    if (isAIViolation(aiModeration)) {
      try {
        moderationPenalty = await applyProgressiveModerationPenalty({
          userId: saveResult.post.author,
        });
      } catch (penaltyError) {
        console.error(
          "Error applying moderation penalty for post:",
          penaltyError,
        );
      }
    }

    try {
      const io = req.app.get("io");
      await NotificationService.createReportProcessedNotification(
        effectiveUserId,
        saveResult.post._id,
        normalizedReason.reasonCode,
        aiModeration,
        io,
        {
          reportedUserId: saveResult.post.author,
          entityType: "post",
          moderationPenalty,
          entityLink: `/post/${saveResult.post._id}`,
        },
      );
    } catch (notificationError) {
      console.error(
        "Error sending report processed notification:",
        notificationError,
      );
    }

    return res.status(200).json({
      success: true,
      message: existingModeration
        ? "Report submitted (reused existing AI evaluation)"
        : "Report submitted",
      data: {
        postId: saveResult.post._id,
        isTemporarilyHidden: Boolean(saveResult.post.isTemporarilyHidden),
        report: Array.isArray(saveResult.post.reports)
          ? saveResult.post.reports.length
          : 0,
        reports: Array.isArray(saveResult.post.reports)
          ? saveResult.post.reports
          : [],
        reasonCode: normalizedReason.reasonCode,
        aiModeration,
        moderationPenalty,
      },
    });
  } catch (err) {
    next(err);
  }
};
