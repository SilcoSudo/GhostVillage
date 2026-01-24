// Import Service dùng chung cho cả Web và Game
import { AuthService } from "../authService.js";

export const loginGame = async (req, res) => {
  try {
    console.log(
      "[Game Login] Attempt for:",
      req.body.email || req.body.username,
    );

    // Hỗ trợ cả trường email hoặc username từ Unity gửi lên
    const email = req.body.email || req.body.username;
    const { password } = req.body;

    if (!email || !password) {
      return res
        .status(200)
        .json({ success: false, error: "Missing email or password" });
    }

    // BƯỚC 1: Sử dụng logic Login chung (Kiểm tra User, Password, Verification)
    const auth = await AuthService.loginWeb(email, password, false);

    // BƯỚC 2: Sử dụng logic Game-specific (Lấy hoặc tự tạo Player Profile)
    const playerProfile = await AuthService.getOrCreatePlayerProfile(
      auth.user._id,
      auth.user.fullname,
    );

    // Trả về đúng format Unity cần: 1 cục data chứa cả Token, User và Player
    return res.status(200).json({
      success: true,
      data: {
        token: auth.token,
        user: auth.user,
        player: playerProfile,
      },
    });
  } catch (error) {
    console.error("[Game Login Error]:", error.message);
    // Luôn trả về 200 kèm success: false để Unity Client dễ xử lý logic
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
};

export const getMeGame = async (req, res) => {
  try {
    // req.user được middleware auth giải mã từ token và gán vào request
    const userId = req.user.userId;

    // Lấy thông tin Player dựa trên User ID đã được xác thực
    const player = await AuthService.getOrCreatePlayerProfile(userId);

    return res.status(200).json({
      success: true,
      data: player,
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

export const logoutGame = (req, res) => {
  return res.status(200).json({ success: true, message: "Logout successful" });
};
