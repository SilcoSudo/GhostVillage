import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import AuthDataAccess from './authDataAccess.js';

/**
 * Auth Service
 * Business logic for authentication
 */

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

export const AuthService = {
  // Register new user
  register: async (email, username, password) => {
    // Check if user already exists
    const existingUser = await AuthDataAccess.userExists(email, username);
    if (existingUser) {
      throw new Error('Email or username already exists');
    }

    // Create new user
    const user = await AuthDataAccess.createUser({
      email: email.toLowerCase(),
      username,
      password
    });

    const token = generateToken(user._id);

    return {
      token,
      user: user.toJSON()
    };
  },

  // Login user
  login: async (identifier, password) => {
    // Find user by email or username
    const user = await AuthDataAccess.findByEmailOrUsername(identifier, identifier);
    
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

  // Verify token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    const user = await AuthDataAccess.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.toJSON();
  }
};

export default AuthService;
