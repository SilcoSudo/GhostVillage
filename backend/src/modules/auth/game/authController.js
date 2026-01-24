// Import Service dùng chung cho cả Web và Game
import { AuthService } from "../authService.js";

export const loginGame = async (req, res) => {
  try {
    console.log(
      "[Game Login] Attempt for:",
      req.body.email || req.body.username
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
      auth.user.fullname
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

/**
 * Complete user profile - Add date of birth
 * POST /api/game/auth/complete-profile
 * Body: { dateOfBirth: "1995-05-15" }
 * Header: Authorization: Bearer <token>
 */
export const completeProfile = async (req, res) => {
  try {
    console.log("[CompleteProfile] req.user:", req.user);
    console.log("[CompleteProfile] req.user._id:", req.user?._id);
    
    const userId = req.user._id; // From authMiddleware (full user object from DB)
    const { dateOfBirth } = req.body;

    if (!dateOfBirth) {
      return res.status(200).json({
        success: false,
        error: "Date of birth is required",
      });
    }

    // Parse and validate date
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(200).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Check age (must be 13+)
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    if (age < 13) {
      return res.status(200).json({
        success: false,
        error: "You must be at least 13 years old to play",
      });
    }

    // Update user profile
    const user = await AuthService.updateUserDateOfBirth(userId, dob);

    // Get player profile
    const player = await AuthService.getOrCreatePlayerProfile(
      userId,
      user.fullname
    );

    // Return full login response
    return res.status(200).json({
      success: true,
      data: {
        token: req.headers.authorization?.replace("Bearer ", ""),
        user: user.toJSON ? user.toJSON() : user,
        player: player.toJSON ? player.toJSON() : player,
      },
    });
  } catch (error) {
    console.error("[Complete Profile Error]:", error.message);
    return res.status(200).json({
      success: false,
      error: error.message,
    });
  }
};
