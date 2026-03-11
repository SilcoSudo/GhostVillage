import Comment from "./commentModel.js";
import * as postService from "../posts/postService.js";
import { isAIViolation } from "../../../services/moderationPenaltyService.js";
import User from "../../user/userModel.js";

export const getComments = async (postId, { parentId = null } = {}) => {
  const query = {
    post: postId,
    isDeleted: false,
    isHiddenByModeration: { $ne: true },
  };

  if (parentId === "null" || parentId === null || parentId === undefined) {
    query.parentId = null;
  } else {
    query.parentId = parentId;
  }

  const comments = await Comment.find(query)
    .sort({ createdAt: -1 })
    .populate("author", "fullname avatar")
    .populate({
      path: "parentId",
      select: "author",
      populate: {
        path: "author",
        select: "fullname avatar",
      },
    })
    .lean();

  return comments;
};

export const getCommentById = async (commentId) => {
  return await Comment.findById(commentId).populate(
    "author",
    "fullname avatar",
  );
};

export const createComment = async ({
  postId,
  authorId,
  content,
  parentId = null,
}) => {
  const comment = await Comment.create({
    post: postId,
    author: authorId,
    content,
    parentId: parentId || null,
  });

  // Increment post comment count
  await postService.incrementCommentCount(postId);

  return await comment.populate("author", "fullname avatar");
};

export const updateComment = async (commentId, userId, content) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check if user is the author
  if (String(comment.author) !== String(userId)) {
    throw new Error("Not authorized to update this comment");
  }

  if (!content || !content.trim()) {
    throw new Error("Content is required");
  }

  comment.content = content.trim();
  await comment.save();

  return await comment.populate("author", "fullname avatar").populate({
    path: "parentId",
    select: "author",
    populate: {
      path: "author",
      select: "fullname avatar",
    },
  });
};

export const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check if user is the author
  if (String(comment.author) !== String(userId)) {
    throw new Error("Not authorized to delete this comment");
  }

  // Soft delete
  comment.isDeleted = true;
  await comment.save();

  // Decrement post comment count
  await postService.decrementCommentCount(comment.post);

  // Also soft delete all replies
  if (!comment.parentId) {
    await Comment.updateMany({ parentId: commentId }, { isDeleted: true });
  }

  return comment;
};

export const addCommentReport = async (commentId, reportPayload) => {
  const comment = await Comment.findById(commentId);
  if (!comment) return null;

  const reporterId = String(reportPayload?.reporter || "");
  const alreadyReportedByUser = (comment.reports || []).some(
    (item) => String(item?.reporter) === reporterId,
  );

  if (alreadyReportedByUser) {
    return { comment, duplicated: true };
  }

  comment.reports.push(reportPayload);
  if (isAIViolation(reportPayload?.aiModeration)) {
    comment.isHiddenByModeration = true;
  }

  await comment.save();
  return { comment, duplicated: false };
};

export const listReportedCommentsForAdmin = async ({
  page = 1,
  limit = 50,
  search,
}) => {
  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
  const skip = (p - 1) * l;

  const filter = {
    isDeleted: false,
    isHiddenByModeration: true,
    "reports.0": { $exists: true },
  };

  const normalizedSearch = String(search || "").trim();
  if (normalizedSearch) {
    const users = await User.find(
      { fullname: { $regex: normalizedSearch, $options: "i" } },
      { _id: 1 },
    ).lean();

    const authorIds = users.map((user) => user._id);
    if (authorIds.length === 0) {
      return {
        items: [],
        pagination: {
          page: p,
          limit: l,
          total: 0,
          totalPages: 1,
          hasMore: false,
        },
      };
    }

    filter.author = { $in: authorIds };
  }

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate("author", "fullname avatar")
      .populate("post", "title"),
    Comment.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(total / l), 1);
  const hasMore = p < totalPages;

  return {
    items,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages,
      hasMore,
    },
  };
};

export const restoreHiddenComment = async (commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) return null;

  comment.isHiddenByModeration = false;
  comment.updatedAt = new Date();
  await comment.save();

  return comment;
};
