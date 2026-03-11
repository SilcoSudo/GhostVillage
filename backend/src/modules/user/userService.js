import User from "./userModel.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "../../services/uploadService.js";

/**
 * Service layer - Business logic & Database operations
 */

/* =========================================================
 * SECTION A: USER PROFILE / WEB USER SERVICES
 * ========================================================= */

/**
 * Find user by ID
 */
export const findUserById = async (userId) => {
  return await User.findById(userId);
};

/**
 * Update user profile with given data
 */
export const updateUserProfile = async (userId, updateData) => {
  return await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
};

/**
 * Update user name
 */
export const updateUserName = async (userId, fullname) => {
  return await User.findByIdAndUpdate(
    userId,
    { fullname: fullname.trim() },
    { new: true },
  );
};

/**
 * Toggle email visibility for a user
 */
export const toggleUserEmailVisibility = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.emailVisibility = !user.emailVisibility;
  await user.save();

  return { emailVisibility: user.emailVisibility };
};

/**
 * Upload user avatar to Cloudinary and update profile
 */
export const uploadUserAvatar = async (userId, fileBuffer, mimeType) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Delete old avatar from Cloudinary if it exists
  if (user.avatar) {
    const oldPublicId = extractPublicIdFromUrl(user.avatar);
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId);
      } catch (deleteError) {
        console.warn("Failed to delete old avatar:", deleteError.message);
        // Don't fail the upload if old image deletion fails
      }
    }
  }

  // Upload new avatar to Cloudinary
  const uploadResult = await uploadToCloudinary(fileBuffer, {
    folder: `ghostvillage/avatars/${userId}`,
    public_id: `avatar_${Date.now()}`,
    resource_type: "image",
    mimeType: mimeType,
    quality: "auto",
    fetch_format: "auto",
    width: 300,
    height: 300,
    crop: "fill",
    gravity: "auto",
  });

  user.avatar = uploadResult.secure_url;
  await user.save();

  return user;
};

/**
 * Complete user profile (for OAuth users)
 */
export const completeUserProfile = async (userId, dateOfBirth, password) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.dateOfBirth = new Date(dateOfBirth);
  user.password = password; // Will be hashed by pre-save hook

  await user.save();

  return user;
};

/**
 * Get user's saved posts with populated data
 */
export const getUserSavedPosts = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "bookmarks",
    populate: {
      path: "author",
      select: "fullname avatar",
    },
    options: { sort: { createdAt: -1 } },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.bookmarks || [];
};

/**
 * Get user's posts
 */
export const getUserPosts = async (userId, { page = 1, limit = 10 } = {}) => {
  const Post = (await import("../forum/posts/postModel.js")).default;

  const p = Math.max(parseInt(page) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
  const skip = (p - 1) * l;

  const [posts, total] = await Promise.all([
    Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate("author", "fullname avatar")
      .lean(),
    Post.countDocuments({ author: userId }),
  ]);

  return {
    posts,
    pagination: {
      page: p,
      limit: l,
      total,
      hasMore: skip + posts.length < total,
    },
  };
};

/**
 * Format user profile data (for authenticated user viewing own profile)
 */
export const formatUserProfile = (user) => {
  return {
    id: user._id,
    _id: user._id,
    email: user.email,
    fullname: user.fullname,
    avatar: user.avatar,
    bio: user.bio,
    postCount: user.postCount || 0,
    role: user.role,
    isVerified: user.isVerified,
    emailVisibility: user.emailVisibility,
    createdAt: user.createdAt,
  };
};

/**
 * Format public profile data (respecting email visibility settings)
 */
export const formatPublicProfile = (user) => {
  return {
    id: user._id,
    _id: user._id,
    email: user.emailVisibility ? user.email : null,
    fullname: user.fullname,
    avatar: user.avatar,
    bio: user.bio,
    postCount: user.postCount || 0,
    role: user.role,
    isVerified: user.isVerified,
    emailVisibility: user.emailVisibility,
    createdAt: user.createdAt,
  };
};

/* =========================================================
 * SECTION B: ADMIN USER MANAGEMENT SERVICES
 * ========================================================= */

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

export const listAdminUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  includeAdmins = false,
} = {}) => {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 10);
  const q = String(search || "").trim();
  const now = new Date();

  const filter = {};
  if (!toBoolean(includeAdmins)) {
    filter.role = { $ne: "admin" };
  }

  if (q) {
    filter.$or = [
      { fullname: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (p - 1) * l;

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: filter },
      {
        $addFields: {
          effectiveMutedUntil: "$moderation.mutedUntil",
          isMutedNow: {
            $or: [
              { $eq: ["$isMute", true] },
              { $gt: ["$moderation.mutedUntil", now] },
            ],
          },
        },
      },
      {
        $sort: {
          isMutedNow: -1,
          effectiveMutedUntil: -1,
          createdAt: -1,
        },
      },
      { $skip: skip },
      { $limit: l },
      {
        $project: {
          fullname: 1,
          email: 1,
          avatar: 1,
          role: 1,
          isVerified: 1,
          isMute: 1,
          moderation: 1,
          createdAt: 1,
          updatedAt: 1,
          isMutedNow: 1,
        },
      },
    ]),
    User.countDocuments(filter),
  ]);

  const items = users.map((user) => ({
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar || null,
    role: user.role,
    isVerified: Boolean(user.isVerified),
    isMute: Boolean(user.isMutedNow ?? user.isMute),
    moderation: user.moderation || null,
    status: user.isVerified ? "active" : "pending",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return {
    items,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.max(Math.ceil(total / l), 1),
    },
  };
};

export const unmuteUserByAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "admin") {
    const error = new Error("Cannot update admin account");
    error.statusCode = 400;
    throw error;
  }

  user.isMute = false;

  if (user.moderation) {
    user.moderation.mutedUntil = null;
    user.moderation.lastActionAt = new Date();
  }

  await user.save();

  return {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    avatar: user.avatar || null,
    role: user.role,
    isVerified: Boolean(user.isVerified),
    isMute: Boolean(user.isMute),
    moderation: user.moderation || null,
    status: user.isVerified ? "active" : "pending",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
