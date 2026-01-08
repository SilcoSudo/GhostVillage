import Player from './playerModel.js';

/**
 * Data Access Layer for Player
 * Handles all database operations
 */

export const PlayerDataAccess = {
  // Find by email
  findByEmail: async (email) => {
    return await Player.findOne({ email: email.toLowerCase() });
  },

  // Find by username
  findByUsername: async (username) => {
    return await Player.findOne({ username });
  },

  // Find by email or username
  findByEmailOrUsername: async (email, username) => {
    return await Player.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });
  },

  // Find by ID
  findById: async (id) => {
    return await Player.findById(id);
  },

  // Create new player
  create: async (playerData) => {
    const player = new Player(playerData);
    return await player.save();
  },

  // Update player
  update: async (id, updateData) => {
    return await Player.findByIdAndUpdate(id, updateData, { new: true });
  },

  // Delete player
  delete: async (id) => {
    return await Player.findByIdAndDelete(id);
  },

  // Find all (with pagination)
  findAll: async (skip = 0, limit = 10) => {
    return await Player.find()
      .skip(skip)
      .limit(limit)
      .exec();
  },

  // Count total
  count: async () => {
    return await Player.countDocuments();
  }
};

export default PlayerDataAccess;
