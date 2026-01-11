// Import đúng Service Game vừa tạo ở trên
import GameAuthService from "./authService.js";

export const loginGame = async (req, res) => {
  try {
    console.log("[Game Login] Request:", req.body);

    const email = req.body.email || req.body.username;
    const { password } = req.body;

    if (!email || !password) {
      return res
        .status(200)
        .json({ success: false, error: "Missing credentials" });
    }

    // GỌI SERVICE GAME (Tên hàm chuẩn)
    const result = await GameAuthService.loginGame(email, password);

    // Trả về đúng format Unity cần
    return res.status(200).json({
      success: true,
      data: {
        token: result.token,
        user: result.user, // { id, email... }
        player: result.player, // { profile, inventory... }
      },
    });
  } catch (error) {
    console.error("Game Login Error:", error.message);
    return res.status(200).json({
      success: false,
      error: error.message, // "User not found" hoặc "Invalid password"
    });
  }
};

export const logoutGame = (req, res) => {
  return res.status(200).json({ success: true, message: "Logout successful" });
};

export const getMeGame = async (req, res) => {
  try {
    // req.user được middleware auth giải mã từ token
    const userId = req.user._id;

    const player = await GameAuthService.getPlayerByUserId(userId);

    return res.status(200).json({
      success: true,
      data: player,
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};
