import User from "./userModel.js";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl } from "../../services/uploadService.js";

/**
 * GET /web/user/profile/me
 * Lấy profile của user hiện tại (sử dụng trong auth restore)
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = req.user; // Từ authMiddleware
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Return clean user data - same format as login
    return res.status(200).json({
      success: true,
      data: {
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
      },
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
    console.log(`Searching for profile with ID: ${id}`);
    
    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/i)) {
       return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const user = await User.findById(id);
    
    if (!user) {
      console.log(`User not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: `Subject ${id} not found in database` });
    }

    // Return standardized profile data
    res.status(200).json({ 
      success: true, 
      data: {
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
      }
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
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio.trim();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return updated profile data
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser._id,
        _id: updatedUser._id,
        email: updatedUser.email,
        fullname: updatedUser.fullname,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        postCount: updatedUser.postCount || 0,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        emailVisibility: updatedUser.emailVisibility,
        createdAt: updatedUser.createdAt,
      },
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

    const user = await User.findByIdAndUpdate(userId, { fullname: fullname.trim() }, { new: true });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleEmailVisibility = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.emailVisibility = !user.emailVisibility;
    await user.save();
    res.status(200).json({ success: true, data: { emailVisibility: user.emailVisibility } });
  } catch (error) {
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

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: `ghostvillage/avatars/${userId}`,
      public_id: `avatar_${Date.now()}`,
      resource_type: 'image',
      mimeType: req.file.mimetype,
      quality: 'auto',
      fetch_format: 'auto',
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
    });

    // Update user avatar URL
    user.avatar = uploadResult.secure_url;
    await user.save();

    // Return updated user data
    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
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
      },
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
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
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete profile",
    });
  }
};

const UserService = {
  getUserIdProfile,
  updateName,
  toggleEmailVisibility,
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

    // Populate bookmarks with full post data
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      populate: {
        path: "author",
        select: "fullname avatar",
      },
      options: { sort: { createdAt: -1 } }, // Newest first
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        posts: user.bookmarks || [],
      },
    });
  } catch (error) {
    console.error("Get Saved Posts error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch saved posts",
    });
  }
};
