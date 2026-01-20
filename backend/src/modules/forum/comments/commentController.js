import * as commentService from "./commentService.js";

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
        avatarUrl: c.author.avatar || null,
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
