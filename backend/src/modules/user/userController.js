import * as userService from "./userService.js";
import * as postService from "../forum/posts/postService.js";
import FriendService from "../friend/web/friendService.js";

const getProfileFriends = async (userId) => {
  try {
    return await FriendService.getFriendList(userId);
  } catch (error) {
    console.warn("Error fetching profile friends:", error);
    return [];
  }
};

const serializeUserPost = (post) => {
  const authorName =
    post?.author?.fullname || post?.author?.username || "Anonymous User";

  return {
    ...post,
    author: post?.author
      ? {
          _id: post.author._id || post.author,
          username: authorName,
          fullname: authorName,
          avatar: post.author.avatar || null,
        }
      : null,
    likes: Array.isArray(post?.likes) ? post.likes : [],
    reports: Array.isArray(post?.reports) ? post.reports : [],
    report: Array.isArray(post?.reports) ? post.reports.length : 0,
    commentCount: post?.commentCount || 0,
  };
};

/**
 * Controller layer - HTTP handling & Validation
 */

/**
 * GET /web/user/profile/me
 * Lấy profile của user hiện tại (sử dụng trong auth restore)
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = req.user; // Từ authMiddleware
    const { page = 1, limit = 10 } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Get user's posts and accepted friends in parallel
    const [{ posts, pagination }, friends] = await Promise.all([
      userService.getUserPosts(user._id, { page, limit }),
      getProfileFriends(user._id),
    ]);

    const profileData = {
      ...userService.formatUserProfile(user),
      friends,
      posts: posts.map((post) => ({
        _id: post._id,
        title: post.title,
        body:
          post.body?.substring(0, 150) + (post.body?.length > 150 ? "..." : ""),
        category: post.category,
        author: {
          _id: post.author._id,
          fullname: post.author.fullname,
          avatar: post.author.avatar,
        },
        likes: Array.isArray(post.likes) ? post.likes.length : 0,
        commentCount: post.commentCount || 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      pagination,
    };

    return res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Error fetching my profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

/**
 * GET /web/user/profile/:id
 * Lấy public profile của user khác
 */
export const getUserIdProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log(`Searching for profile with ID: ${id}`);

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/i)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const user = await userService.findUserById(id);

    if (!user) {
      console.log(`User not found for ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: `Subject ${id} not found in database`,
      });
    }

    // Get user's posts and accepted friends in parallel
    const [{ posts, pagination }, friends] = await Promise.all([
      userService.getUserPosts(id, { page, limit }),
      getProfileFriends(id),
    ]);

    const profileData = {
      ...userService.formatPublicProfile(user),
      friends,
      posts: posts.map((post) => ({
        _id: post._id,
        title: post.title,
        body:
          post.body?.substring(0, 150) + (post.body?.length > 150 ? "..." : ""),
        category: post.category,
        author: {
          _id: post.author._id,
          fullname: post.author.fullname,
          avatar: post.author.avatar,
        },
        likes: Array.isArray(post.likes) ? post.likes.length : 0,
        commentCount: post.commentCount || 0,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })),
      pagination,
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error(`Error in getUserIdProfile: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /web/user/profile/me
 * Update profile của user (fullname, avatar, bio)
 */
export const updateMyProfile = async (req, res) => {
  try {
    const user = req.user; // Từ authMiddleware
    const { fullname, avatar, bio } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validation
    const errors = {};

    if (fullname !== undefined) {
      if (typeof fullname !== "string") {
        errors.fullname = "Name must be a string";
      } else if (fullname.trim().length === 0) {
        errors.fullname = "Name cannot be empty";
      } else if (fullname.length > 100) {
        errors.fullname = "Name must be less than 100 characters";
      }
    }

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== "string") {
        errors.avatar = "Avatar must be a URL string or null";
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        errors.bio = "Bio must be a string";
      } else if (bio.length > 500) {
        errors.bio = "Bio must be less than 500 characters";
      }
    }

    // Check validation errors
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Create update object (only allowed fields)
    const updateData = {};
    if (fullname !== undefined) updateData.fullname = fullname.trim();
    if (bio !== undefined) updateData.bio = bio.trim();

    // Handle avatar update
    if (avatar !== undefined) {
      // If avatar is null, just set it to null
      if (avatar === null) {
        updateData.avatar = null;
      }
      // If avatar is a base64 string, upload to Cloudinary first
      else if (avatar.startsWith("data:image/")) {
        try {
          // Extract base64 data
          const matches = avatar.match(/^data:image\/(\w+);base64,(.+)$/);
          if (!matches) {
            return res.status(400).json({
              success: false,
              message: "Invalid base64 image format",
            });
          }

          const mimeType = `image/${matches[1]}`;
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Upload to Cloudinary using existing service
          const uploadedUser = await userService.uploadUserAvatar(
            user._id,
            buffer,
            mimeType,
          );

          // Use the uploaded avatar URL
          updateData.avatar = uploadedUser.avatar;
        } catch (uploadError) {
          console.error("Avatar upload error:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Failed to upload avatar",
            error: uploadError.message,
          });
        }
      }
      // Otherwise, assume it's a URL
      else {
        updateData.avatar = avatar;
      }
    }

    const updatedUser = await userService.updateUserProfile(
      user._id,
      updateData,
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const profileData = userService.formatUserProfile(updatedUser);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

export const updateName = async (req, res) => {
  try {
    const { fullname } = req.body;
    const userId = req.user._id; // From middleware

    if (!fullname || fullname.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    const user = await userService.updateUserName(userId, fullname);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleEmailVisibility = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await userService.toggleUserEmailVisibility(userId);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /web/user/avatar/upload
 * Upload avatar to Cloudinary and update user profile
 */
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await userService.uploadUserAvatar(
      userId,
      req.file.buffer,
      req.file.mimetype,
    );

    const profileData = userService.formatUserProfile(user);

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload avatar",
    });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { dateOfBirth, password } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Password strength validation (same as register)
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a special character",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Before update - password:", user.password);
    console.log("New password from request:", password);

    user.dateOfBirth = new Date(dateOfBirth);
    user.password = password; // Will be hashed by pre-save hook

    console.log(
      "After setting - isModified('password'):",
      user.isModified("password"),
    );
    console.log("After setting - password value:", user.password);

    await user.save();

    console.log("After save - password (should be hashed):", user.password);

    return res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Complete Profile error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete profile",
    });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const posts = await userService.getUserSavedPosts(userId);

    return res.status(200).json({
      success: true,
      data: {
        posts: posts,
      },
    });
  } catch (error) {
    console.error("Get Saved Posts error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch saved posts",
    });
  }
};

/**
 * GET /web/user/:id/posts
 * Get the current user's published posts feed
 */
export const getUserPostsById = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/i)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    const isOwner = String(req.user._id) === String(id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own posts",
      });
    }

    const { posts, pagination } = await userService.getUserPosts(id, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: {
        posts: posts.map(serializeUserPost),
        pagination,
      },
    });
  } catch (error) {
    console.error("Get User Posts error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch posts",
    });
  }
};

/* =========================================================
 * SECTION B: ADMIN USER MANAGEMENT CONTROLLERS
 * ========================================================= */

/**
 * GET /admin/users
 * List users for admin management page
 */
export const listUsersForAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      includeAdmins = false,
    } = req.query;

    const { items, pagination } = await userService.listAdminUsers({
      page,
      limit,
      search,
      includeAdmins,
    });

    return res.status(200).json({
      success: true,
      data: {
        users: items,
        pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/users/:id/unmute
 * Restore posting/commenting ability for a muted user
 */
export const unmuteUserForAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedUser = await userService.unmuteUserByAdmin(id);

    return res.status(200).json({
      success: true,
      message: "User unmuted successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
