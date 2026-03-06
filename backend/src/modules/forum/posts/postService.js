import Post from "./postModel.js";
import UserModel from "../../user/userModel.js";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../../../services/uploadService.js";
import { isAIViolation } from "../../../services/moderationPenaltyService.js";

export const listPosts = async ({
  page = 1,
  limit = 10,
  category,
  reportedOnly = false,
  hiddenOnly = false,
}) => {
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
  const skip = (p - 1) * l;

  // Build query filter
  const filter = {};
  if (category && category !== "all") {
    filter.category = category;
  }
  if (reportedOnly) {
    // Only posts with at least one report entry
    filter["reports.0"] = { $exists: true };
  }
  if (hiddenOnly) {
    // Only posts that are currently hidden by moderation
    filter.isTemporarilyHidden = true;
  }

  const sort = hiddenOnly
    ? { updatedAt: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(l)
      .populate("author", "fullname avatar"),
    Post.countDocuments(filter),
  ]);

  const hasMore = skip + items.length < total;
  return { items, pagination: { page: p, limit: l, total, hasMore } };
};

export const getPostById = async (id) => {
  return await Post.findById(id).populate("author", "fullname avatar");
};

export const createPost = async ({ title, body, author, category, media }) => {
  const post = await Post.create({
    title,
    body,
    author,
    category,
    media: media || [],
  });
  return await post.populate("author", "fullname avatar");
};

export const updatePost = async (id, { title, body, category, media }) => {
  const existingPost = await Post.findById(id);
  if (!existingPost) return null;

  const nextMedia = Array.isArray(media) ? media : [];
  const nextKeys = new Set(
    nextMedia.map((item) => item.publicId || item.url).filter(Boolean),
  );

  const removedMedia = (existingPost.media || []).filter((item) => {
    const key = item.publicId || item.url;
    return key && !nextKeys.has(key);
  });

  if (removedMedia.length > 0) {
    await Promise.allSettled(
      removedMedia.map(async (item) => {
        const publicId = item.publicId || extractPublicIdFromUrl(item.url);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }),
    );
  }

  return await Post.findByIdAndUpdate(
    id,
    {
      title,
      body,
      category,
      media: nextMedia,
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    },
    { new: true },
  ).populate("author", "fullname avatar");
};

export const deletePost = async (id) => {
  const post = await Post.findById(id);
  if (!post) return null;

  const mediaList = Array.isArray(post.media) ? post.media : [];
  if (mediaList.length > 0) {
    await Promise.allSettled(
      mediaList.map(async (item) => {
        const publicId = item.publicId || extractPublicIdFromUrl(item.url);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      }),
    );
  }

  await post.deleteOne();
  return post;
};

export const toggleLike = async (id, userId) => {
  const post = await Post.findById(id);
  if (!post) return null;
  const idx = post.likes.findIndex((x) => String(x) === String(userId));
  if (idx >= 0) post.likes.splice(idx, 1);
  else post.likes.push(userId);
  await post.save();
  return post;
};

export const toggleBookmark = async (id, userId) => {
  const User = UserModel;
  const post = await Post.findById(id);
  if (!post) return null;

  // Only update User.bookmarks
  const user = await User.findById(userId);
  if (user) {
    const userBookmarkIdx = user.bookmarks.findIndex(
      (x) => String(x) === String(id),
    );
    if (userBookmarkIdx >= 0) {
      user.bookmarks.splice(userBookmarkIdx, 1);
    } else {
      user.bookmarks.push(id);
    }
    await user.save();
  }

  return post;
};

export const incrementCommentCount = async (id) => {
  return await Post.findByIdAndUpdate(
    id,
    { $inc: { commentCount: 1 } },
    { new: true },
  );
};

export const decrementCommentCount = async (id) => {
  return await Post.findByIdAndUpdate(
    id,
    { $inc: { commentCount: -1 } },
    { new: true },
  );
};

export const toggleLockPost = async (id) => {
  const post = await Post.findById(id);
  if (!post) return null;
  post.isLocked = !post.isLocked;
  await post.save();
  return post;
};

export const countUniqueReporters = async (id) => {
  const post = await Post.findById(id).select("reports.reporter");
  if (!post) return null;

  const reporterIds = new Set(
    (post.reports || []).map((item) => String(item?.reporter)).filter(Boolean),
  );

  return reporterIds.size;
};

export const addPostReport = async (id, reportPayload) => {
  const post = await Post.findById(id);
  if (!post) return null;

  const reporterId = String(reportPayload?.reporter || "");
  const alreadyReported = (post.reports || []).some(
    (item) => String(item?.reporter) === reporterId,
  );

  if (alreadyReported) {
    return { post, duplicated: true };
  }

  post.reports.push(reportPayload);
  post.updatedAt = new Date();
  if (isAIViolation(reportPayload?.aiModeration)) {
    post.isTemporarilyHidden = true;
  }
  await post.save();

  return { post, duplicated: false };
};
