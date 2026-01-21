import * as postService from "./postService.js";

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
        avatar: user.avatar || null,
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
    commentCount: p.commentCount || 0,
  };
};

export const listPosts = async (req, res, next) => {
  try {
    const { page, limit, category } = req.query;
    const { items, pagination } = await postService.listPosts({
      page,
      limit,
      category,
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
    if (!title || !body) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const effectiveAuthor = author || (req.user && req.user._id) || undefined;
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
