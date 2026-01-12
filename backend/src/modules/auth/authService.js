import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../../config/env.js";
import MailService from "../../services/mailService.js";
import userModel from "../user/userModel.js";
import Player from '../player/playerModel.js';

/**
 * Auth Service
 * Business logic for authentication
 * - Web uses User model (forum user)
 * - Game uses Player model (game player)
 * Handles validation, password hashing, and token generation
 */

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const AuthService = {
  // Register new user (do NOT save to DB yet) - send verification email
  register: async (email, fullname, password, dateOfBirth) => {
    // password strength validation
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(password)) {
      throw new Error(
        "Password must be at least 8 characters and include uppercase, lowercase and a special character"
      );
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email: email.toLowerCase() }, { fullname }],
    });
    if (existingUser) {
      throw new Error("Email or fullname already exists");
    }

    // Hash password before embedding in token
    const saltRounds = parseInt(config.bcryptRounds, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create a short-lived verification token containing necessary data
    const verificationPayload = {
      email: email.toLowerCase(),
      fullname,
      passwordHash,
      dateOfBirth,
    };

    const verificationToken = jwt.sign(verificationPayload, config.jwt.secret, {
      expiresIn: "1h",
    });

    // Send verification email with link
    const verificationLink = `${config.appUrl.replace(
      /\/+$/,
      ""
    )}/verify-email?token=${verificationToken}`;
    await MailService.sendVerificationEmail(email, verificationLink);

    return { sent: true };
  },

  // Complete registration from verification token: create user and return auth token
  completeRegistration: async (token) => {
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      const { email, fullname, passwordHash, dateOfBirth } = payload;

      // Double-check user doesn't already exist
      const existingUser = await userModel.findOne({
        $or: [{ email }, { fullname }],
      });
      if (existingUser) {
        throw new Error("User already exists");
      }

      // Create user with hashed password (passwordHash is already bcrypt)
      const newUser = new userModel({
        email,
        fullname,
        password: passwordHash,
        dateOfBirth: new Date(dateOfBirth),
      });

      await newUser.save();

      const authToken = generateToken(newUser._id);
      return { token: authToken, user: newUser.toJSON() };
    } catch (err) {
      throw new Error(err.message || "Invalid or expired token");
    }
  },

  /**
   * WEB: Login user (forum/web)
   */
  loginWeb: async (email, password) => {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new Error("User not found");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const token = generateToken(user._id);

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
          avatar: 'avatar_default_01',
          level: 1,
          exp: 0,
          coin: 1000
        },
        inventory: {
          unlockedSkins: ['skin_default'],
          unlockedPerks: []
        }
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
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.toJSON();
  },

  // Get player by ID (game)
  getPlayerById: async (playerId) => {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    return player.toJSON();
  }
};

export default AuthService;
