import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { config } from "../../config/env.js";
import MailService from "../../services/mailService.js";
import userModel from "../user/userModel.js";
import Player from "../player/playerModel.js";

/**
 * Auth Service
 * Business logic for authentication
 * - Web uses User model (forum user)
 * - Game uses Player model (game player)
 * Handles validation, password hashing, and token generation
 */

const generateToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe ? "30d" : "1d"; // 30 days if remember me, else 1 day
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn,
  });
};

export const AuthService = {
  /**
   * WEB: User Registration with Email Verification
   */
  // Register new user (do NOT save to DB yet) - send verification email
  register: async (email, fullname, password, dateOfBirth) => {
    // password strength validation
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(password)) {
      throw new Error(
        "Password must be at least 8 characters and include uppercase, lowercase and a special character",
      );
    }

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

    return { sent: true };
  },

  /**
   * WEB: Complete registration from verification token (one-time use)
   */
  completeRegistration: async (token) => {
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
      await user.save();

      const authToken = generateToken(user._id, false);
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

    const token = generateToken(user._id, rememberMe);

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
      // Auto-create player profile on first login
      player = await Player.create({
        userId,
        profile: {
          displayName: displayName || `Player_${userId.toString().slice(-6)}`,
          avatar: "avatar_default_01",
          level: 1,
          exp: 0,
          coin: 1000,
        },
        inventory: {
          unlockedSkins: ["skin_default"],
          unlockedPerks: [],
        },
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
   */
  forgotPassword: async (email) => {
    const user = await userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't leak user existence? Actually for a forum it's fine.
      // But for security, we usually say "If an account exists, an email was sent"
      return { success: true };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetLink = `${config.frontendUrl.replace(
      /\/+$/,
      "",
    )}/reset-password?token=${rawToken}`;
    await MailService.sendResetPasswordEmail(email, resetLink);

    return { success: true };
  },

  /**
   * WEB: Reset Password - Use token to set new password
   */
  resetPassword: async (token, newPassword) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
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
      // Only set avatar from Google if user doesn't have one yet
      if (avatar && (!user.avatar || user.avatar === "")) {
        user.avatar = avatar;
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
        avatar,
        isVerified: true, // Google OAuth users are auto-verified
        password: null, // No password for OAuth users
      });
    }

    const token = generateToken(user._id, true); // Remember me = true for OAuth
    return { token, user: user.toJSON() };
  },
};

export default AuthService;
