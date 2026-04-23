import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../../config/env.js";
import MailService from "../../services/mailService.js";
import userModel from "../user/userModel.js";
import Player from "../player/playerModel.js";
import { uploadToCloudinary } from "../../services/uploadService.js";

/**
 * Auth Service
 * Business logic for authentication
 * - Web uses User model (forum user)
 * - Game uses Player model (game player)
 * Handles validation, password hashing, and token generation
 */

const generateToken = (userId, role, rememberMe = false) => {
  const expiresIn = rememberMe ? "30d" : "1d"; // 30 days if remember me, else 1 day
  const token = jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn,
  });
  console.log("[generateToken]  TOKEN GENERATED:");
  console.log("  userId:", userId, typeof userId);
  console.log("  role:", role);
  console.log("  token:", token.substring(0, 50) + "...");
  return token;
};

const isGoogleAvatarUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /googleusercontent\.com|ggpht\.com/i.test(url);
};

const isCloudinaryUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /res\.cloudinary\.com/i.test(url);
};

const isDataUri = (url) => {
  if (!url || typeof url !== "string") return false;
  return /^data:image\//i.test(url);
};

const normalizeGoogleAvatarUrl = (avatarUrl) => {
  if (!isGoogleAvatarUrl(avatarUrl)) return avatarUrl;
  return avatarUrl.replace(/=s\d+-c$/, "=s512-c");
};

const buildDefaultAvatarUrl = (displayName) => {
  const safeName = String(displayName || "Ghost Village User").trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=f48024&color=fff&format=png&size=512`;
};

const downloadAvatarBuffer = async (avatarUrl) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(avatarUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GhostVillage-Backend/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Avatar download failed with status ${response.status}`);
    }

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};

const syncGoogleAvatarToCloudinary = async (user, googleAvatarUrl) => {
  if (!user || !googleAvatarUrl) {
    return user?.avatar || null;
  }

  if (isCloudinaryUrl(user.avatar)) {
    return user.avatar;
  }

  const normalizedGoogleAvatar = normalizeGoogleAvatarUrl(googleAvatarUrl);
  const sourceAvatarUrl = isGoogleAvatarUrl(user.avatar)
    ? user.avatar
    : normalizedGoogleAvatar;

  const { buffer, mimeType } = await downloadAvatarBuffer(sourceAvatarUrl);
  const uploadResult = await uploadToCloudinary(buffer, {
    folder: `ghostvillage/avatars/google/${user._id}`,
    public_id: `google_avatar_${Date.now()}`,
    resource_type: "image",
    mimeType,
    quality: "auto",
    fetch_format: "auto",
    width: 300,
    height: 300,
    crop: "fill",
    gravity: "auto",
  });

  return uploadResult?.secure_url || null;
};

const syncDefaultAvatarToCloudinary = async (user, displayName) => {
  if (!user) {
    return null;
  }

  if (isCloudinaryUrl(user.avatar)) {
    return user.avatar;
  }

  const defaultAvatarUrl = buildDefaultAvatarUrl(displayName || user.fullname);
  const { buffer, mimeType } = await downloadAvatarBuffer(defaultAvatarUrl);
  const uploadResult = await uploadToCloudinary(buffer, {
    folder: `ghostvillage/avatars/default/${user._id}`,
    public_id: `default_avatar_${Date.now()}`,
    resource_type: "image",
    mimeType,
    quality: "auto",
    fetch_format: "auto",
    width: 300,
    height: 300,
    crop: "fill",
    gravity: "auto",
  });

  return uploadResult?.secure_url || null;
};

const generateUniquePlayerUid = async () => {
  // Generate an 8-digit unique uid for Player profile.
  for (let i = 0; i < 20; i++) {
    const uid = Math.floor(10000000 + Math.random() * 90000000).toString();
    const exists = await Player.exists({ uid });
    if (!exists) return uid;
  }

  throw new Error("Failed to generate unique player uid");
};

export const AuthService = {
  /**
   * WEB: User Registration with Email Verification
   */
  // Register new user (do NOT save to DB yet) - send verification email
  register: async (email, fullname, password, dateOfBirth) => {
    // Check for existing user
    const existingUser = await userModel.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser && existingUser.isVerified) {
      throw new Error("Email already exists");
    }

    // Hash password for storage in pending user
    const saltRounds = parseInt(config.bcryptRounds, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate opaque token and store hash + expiry (stateful)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    if (existingUser) {
      // Update pending user details and reissue verification
      existingUser.fullname = fullname;
      existingUser.password = passwordHash;
      existingUser.dateOfBirth = new Date(dateOfBirth);
      existingUser.verificationTokenHash = tokenHash;
      existingUser.verificationExpires = expiresAt;
      existingUser.verificationUsed = false;
      existingUser.isVerified = false;
      await existingUser.save();
    } else {
      await userModel.create({
        email: email.toLowerCase(),
        fullname,
        password: passwordHash,
        dateOfBirth: new Date(dateOfBirth),
        verificationTokenHash: tokenHash,
        verificationExpires: expiresAt,
        verificationUsed: false,
        isVerified: false,
      });
    }

    // Send verification email with opaque token
    const verificationLink = `${config.frontendUrl.replace(
      /\/+$/,
      "",
    )}/verify-email?token=${rawToken}`;
    await MailService.sendVerificationEmail(email, verificationLink);

    return { success: true };
  },

  /**
   * WEB: Complete registration from verification token (one-time use)
   */
  completeRegistration: async (token, rememberMe = false) => {
    try {
      // Hash the opaque token
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Find pending user by token hash, not used, and not expired
      const now = new Date();
      const user = await userModel.findOne({
        verificationTokenHash: tokenHash,
        verificationUsed: false,
        verificationExpires: { $gt: now },
      });

      if (!user) {
        throw new Error("Invalid or expired token");
      }

      // Mark as verified and consume the token
      user.isVerified = true;
      user.verificationUsed = true;
      user.verificationExpires = null;
      user.verificationTokenHash = null;

      if (!user.avatar) {
        try {
          const defaultAvatar = await syncDefaultAvatarToCloudinary(
            user,
            user.fullname,
          );
          if (defaultAvatar) {
            user.avatar = defaultAvatar;
          }
        } catch (error) {
          console.warn(
            "Default avatar sync failed on verification:",
            error.message,
          );
        }
      }

      await user.save();

      const authToken = generateToken(user._id, user.role, rememberMe);
      return { token: authToken, user: user.toJSON() };
    } catch (err) {
      throw new Error(err.message || "Invalid or expired token");
    }
  },

  /**
   * WEB: Resend verification email
   */
  resendVerification: async (email) => {
    try {
      // Find user by email
      const user = await userModel.findOne({
        email: email.toLowerCase(),
      });

      if (!user) {
        throw new Error("Email not found");
      }

      if (user.isVerified) {
        throw new Error("Email is already verified");
      }

      // Invalidate old token and generate new one
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Update user with new token
      user.verificationTokenHash = tokenHash;
      user.verificationExpires = expiresAt;
      user.verificationUsed = false;
      await user.save();

      // Send verification email with new token
      const verificationLink = `${config.frontendUrl.replace(
        /\/+$/,
        "",
      )}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
      await MailService.sendVerificationEmail(email, verificationLink);

      return { sent: true };
    } catch (err) {
      throw new Error(err.message || "Failed to resend verification email");
    }
  },

  /**
   * WEB: Login user (forum/web)
   */
  loginWeb: async (email, password, rememberMe = false) => {
    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Check if account is verified
    if (!user.isVerified) {
      throw new Error("ACCOUNT_NOT_VERIFIED");
    }

    if (!user.avatar) {
      try {
        const defaultAvatar = await syncDefaultAvatarToCloudinary(
          user,
          user.fullname,
        );
        if (defaultAvatar) {
          user.avatar = defaultAvatar;
          await user.save();
        }
      } catch (error) {
        console.warn("Default avatar sync failed on login:", error.message);
      }
    }

    const token = generateToken(user._id, user.role, rememberMe);

    return {
      token,
      user: user.toJSON(),
    };
  },

  /**
   * GAME: Auto-create Player profile on first login
   * Game login logic handled by game team
   */
  getOrCreatePlayerProfile: async (userId, displayName) => {
    // Check if player exists
    let player = await Player.findOne({ userId });

    if (!player) {
      const uid = await generateUniquePlayerUid();

      // Auto-create player profile on first login
      player = await Player.create({
        userId,
        uid,
        profile: {
          displayName: displayName || `Player_${userId.toString().slice(-6)}`,
          avatar: "avatar_default_01",
          level: 1,
          exp: 0,
          coin: 1000,
        },
        unlockedSkins: ["skin_default"],
        unlockedPerks: [],
      });
    }

    return player.toJSON();
  },

  // Verify token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  },

  // Get user by ID (web)
  getUserById: async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.toJSON();
  },

  // Get player by ID (game)
  getPlayerById: async (playerId) => {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error("Player not found");
    }
    return player.toJSON();
  },

  /**
   * WEB: Change Password
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await userModel.findById(userId).select("+password");

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error("Invalid current password");
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    return { success: true };
  },

  /**
   * WEB: Forgot Password - Send reset link
   * Uses separate token fields to avoid conflicts with email verification
   */
  forgotPassword: async (email) => {
    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Security: Don't leak user existence
      // Return success regardless
      return { success: true };
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new Error("Please verify your email first");
    }

    // Generate opaque token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store token for password reset (using separate fields)
    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Send reset password email with token
    const resetLink = `${config.frontendUrl.replace(
      /\/+$/,
      "",
    )}/reset-password?token=${rawToken}`;
    await MailService.sendResetPasswordEmail(email, resetLink);

    return { success: true };
  },

  /**
   * WEB: Reset Password - Validate token and change password
   * Uses separate reset password token fields
   */
  resetPassword: async (token, newPassword) => {
    // Hash the opaque token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by reset password token, not expired
    const now = new Date();
    const user = await userModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: now },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Update password
    user.password = newPassword;

    // Clean up reset token
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { success: true };
  },

  /**
   * GOOGLE OAUTH: Find or create user from Google profile
   */
  findOrCreateGoogleUser: async ({ googleId, email, fullname, avatar }) => {
    let user = await userModel.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }

      if (
        avatar &&
        (!user.avatar ||
          isGoogleAvatarUrl(user.avatar) ||
          isDataUri(user.avatar))
      ) {
        const normalizedGoogleAvatar = normalizeGoogleAvatarUrl(avatar);
        if (!user.avatar) {
          user.avatar = normalizedGoogleAvatar;
        }

        try {
          const syncedAvatar = await syncGoogleAvatarToCloudinary(user, avatar);
          if (syncedAvatar) {
            user.avatar = syncedAvatar;
          }
        } catch (error) {
          console.warn("Google avatar sync failed:", error.message);
        }
      }

      // Mark as verified (Google verified the email)
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user
      user = await userModel.create({
        googleId,
        email: email.toLowerCase(),
        fullname,
        avatar: avatar ? normalizeGoogleAvatarUrl(avatar) : null,
        isVerified: true, // Google OAuth users are auto-verified
        password: null, // No password for OAuth users
      });

      if (avatar) {
        try {
          user.avatar = await syncGoogleAvatarToCloudinary(user, avatar);
          await user.save();
        } catch (error) {
          console.warn("Initial Google avatar sync failed:", error.message);
        }
      }
    }

    console.log("[findOrCreateGoogleUser] BEFORE GENERATE TOKEN:");
    console.log("  user._id:", user._id, typeof user._id);
    console.log("  user.email:", user.email);
    console.log("  user saved?", !user.isNew);

    const token = generateToken(user._id, user.role, true); // Remember me = true for OAuth
    return { token, user: user.toJSON() };
  },

  /**
   * WEB: Complete OAuth user profile (add password + dateOfBirth)
   */
  completeProfile: async (userId, dateOfBirth, password) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.dateOfBirth = new Date(dateOfBirth);
    user.password = password; // Will be hashed by pre-save hook

    await user.save();

    return user;
  },

  /**
   * GAME: Complete OAuth user profile (dateOfBirth only)
   */
  updateUserDateOfBirth: async (userId, dateOfBirth) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.dateOfBirth = new Date(dateOfBirth);
    await user.save();

    return user;
  },
};

export default AuthService;
