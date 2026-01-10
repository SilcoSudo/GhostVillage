import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import User from '../user/userModel.js';
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
    expiresIn: config.jwt.expiresIn
  });
};

export const AuthService = {
  /**
   * WEB: Register user (forum/web)
   */
  registerWeb: async (email, password) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Create new user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: 'user'
    });

    const token = generateToken(user._id);

    return {
      token,
      user: user.toJSON()
    };
  },

  /**
   * WEB: Login user (forum/web)
   */
  loginWeb: async (email, password) => {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = generateToken(user._id);

    return {
      token,
      user: user.toJSON()
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
      throw new Error('Invalid or expired token');
    }
  },

  // Get user by ID (web)
  getUserById: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
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
