import AuthService from "../authService.js";

/**
 * Web Auth Controller
 * Handles authentication for web clients (forum users)
 */

export const registerWeb = async (req, res) => {
  try {
    const { email, fullName, password, confirmPassword, dateOfBirth } =
      req.body;

    // Validation
    if (!email || !fullName || !password || !confirmPassword || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Send verification email (no DB save yet)
    await AuthService.register(email, fullName, password, dateOfBirth);

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Web Register error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};
export const resendVerificationWeb = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await AuthService.resendVerification(email);

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend Verification error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to resend verification email",
    });
  }
};
export const verifyWeb = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token is required" });
    }

    const result = await AuthService.completeRegistration(token);

    // Set auth cookie and return token + user
    res.cookie("token", result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json({ success: true, token: result.token, user: result.user });
  } catch (error) {
    console.error("Verify error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Verification failed",
    });
  }
};

export const loginWeb = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required",
      });
    }

    const { token, user } = await AuthService.loginWeb(
      email,
      password,
      rememberMe
    );

    // Set cookie expiry based on rememberMe
    const maxAge = rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 1 * 24 * 60 * 60 * 1000; // 30 days or 1 day

    res.cookie("token", token, {
      httpOnly: true,
      maxAge,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Web Login error:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

export const logoutWeb = (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export const getMeWeb = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await AuthService.getUserById(userId);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Me error:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
};

export const changePasswordWeb = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    await AuthService.changePassword(userId, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
};

export const forgotPasswordWeb = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    await AuthService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process forgot password",
    });
  }
};

export const resetPasswordWeb = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Token and password are required" });
    }

    await AuthService.resetPassword(token, password);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};
