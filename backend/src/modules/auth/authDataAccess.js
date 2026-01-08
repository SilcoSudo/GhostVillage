import PlayerDataAccess from '../player/playerDataAccess.js';

/**
 * Data Access Layer for Auth
 * Uses Player data access underneath
 */

export const AuthDataAccess = {
  // Find user by email (for login)
  findByEmail: async (email) => {
    return await PlayerDataAccess.findByEmail(email);
  },

  // Find user by email or username (for login)
  findByEmailOrUsername: async (email, username) => {
    return await PlayerDataAccess.findByEmailOrUsername(email, username);
  },

  // Create new user (for registration)
  createUser: async (userData) => {
    return await PlayerDataAccess.create(userData);
  },

  // Check if user exists
  userExists: async (email, username) => {
    return await PlayerDataAccess.findByEmailOrUsername(email, username);
  },

  // Get user by ID
  getUserById: async (id) => {
    return await PlayerDataAccess.findById(id);
  }
};

export default AuthDataAccess;
