import User from "./userModel.js";

/**
 * User Controller
 * Handles user-related requests
 */

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
