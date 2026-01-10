import jwt from "jsonwebtoken";
// SỬA PATH: Lên 3 cấp mới ra được thư mục src/config
import { config } from "../../../config/env.js";
import User from "../../user/userModel.js";
import Player from "../../player/playerModel.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const AuthService = {
  // --- WEB LOGIC ---
  registerWeb: async (email, password) => {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) throw new Error("Email already exists");

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: "user",
    });

    const token = generateToken(user._id);
    return { token, user: user.toJSON() };
  },

  loginWeb: async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error("User not found");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error("Invalid password");

    const token = generateToken(user._id);
    return { token, user: user.toJSON() };
  },

  // --- SHARED LOGIC (Game dùng ké cái này) ---
  getOrCreatePlayerProfile: async (userId, displayName) => {
    let player = await Player.findOne({ userId });

    if (!player) {
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

  getUserById: async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    return user.toJSON();
  },
};

export default AuthService;
