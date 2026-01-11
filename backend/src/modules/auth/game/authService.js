import jwt from "jsonwebtoken";
// Import config env (Lên 3 cấp thư mục)
import { config } from "../../../config/env.js";
import User from "../../user/userModel.js";
import Player from "../../player/playerModel.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const GameAuthService = {
  /**
   * GAME LOGIN:
   * 1. Check User Credentials (Email/Pass)
   * 2. Auto Get/Create Player Profile
   * 3. Return Token + User + Player
   */
  loginGame: async (email, password) => {
    // 1. Tìm User (Dùng chung bảng User với Web)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Ném lỗi để Controller bắt
    if (!user) throw new Error("User not found");

    // 2. Check Password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new Error("Invalid password");

    // 3. Xử lý Player Profile (Logic riêng của Game)
    let player = await Player.findOne({ userId: user._id });

    // Nếu chưa có Player (User mới từ Web qua), tự động tạo
    if (!player) {
      const displayName = user.email.split("@")[0]; // Lấy tên từ email
      player = await Player.create({
        userId: user._id,
        profile: {
          displayName: displayName,
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

    // 4. Tạo Token
    const token = generateToken(user._id);

    // Trả về dữ liệu đã populate đầy đủ
    return {
      token,
      user: user.toJSON(),
      player: player.toJSON(),
    };
  },

  /**
   * GET PLAYER INFO
   * Dùng cho API /me
   */
  getPlayerByUserId: async (userId) => {
    const player = await Player.findOne({ userId });
    if (!player) throw new Error("Player profile not found");
    return player.toJSON();
  },
};

export default GameAuthService;
