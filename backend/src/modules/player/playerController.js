import { PlayerService } from "./playerService.js";

export const PlayerController = {
  // Hàm lấy Profile
  getProfile: async (req, res) => {
    try {
      // Dùng req.user._id hoặc req.user.id tùy thuộc vào cách bạn gán trong authMiddleware
      const userId = req.user._id || req.user.id;
      const data = await PlayerService.getFullProfileData(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // THÊM MỚI: Hàm tìm kiếm người chơi bằng UID
  searchPlayer: async (req, res) => {
    try {
      const { uid } = req.params;
      const currentUserId = req.user._id || req.user.id;

      // Không cho phép user tự tìm chính mình
      if (currentUserId.toString() === uid) {
        return res.status(400).json({
          success: false,
          message: "Không thể tự tìm kiếm chính mình.",
        });
      }

      const playerData = await PlayerService.searchPlayerByUID(uid);

      return res.status(200).json({
        success: true,
        message: "Tìm thấy người chơi",
        data: playerData,
      });
    } catch (error) {
      console.error("Search player error:", error.message);
      // Trả về mã 404 nếu lỗi chứa từ "Không tìm thấy"
      const statusCode = error.message.includes("Không tìm thấy") ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Lỗi khi tìm kiếm người chơi",
      });
    }
  },

  equipPerks: async (req, res) => {
    try {
      const userId = req.user._id || req.user.id;
      const { perks } = req.body;

      const updatedPerks = await PlayerService.updateEquippedPerks(
        userId,
        perks,
      );

      res
        .status(200)
        .json({ success: true, data: { equippedPerks: updatedPerks } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Lấy dữ liệu Perk cho Lobby Modal
  getPlayerPerks: async (req, res) => {
    try {
      const userId = req.user._id || req.user.id;
      const data = await PlayerService.getPlayerPerksData(userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // ==========================================
  // [MỚI] HỨNG REQUEST ĐỔI AVATAR TỪ UNITY
  // ==========================================
  updateAvatar: async (req, res) => {
    try {
      const userId = req.user._id || req.user.id;
      const { avatarId } = req.body; // Lấy cái ID từ Body JSON do Unity gửi lên

      if (!avatarId) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu ID Avatar!" });
      }

      const updatedAvatar = await PlayerService.updateAvatar(userId, avatarId);

      return res.status(200).json({
        success: true,
        message: "Cập nhật Avatar thành công!",
        data: { avatar: updatedAvatar },
      });
    } catch (error) {
      console.error("Update Avatar error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message || "Lỗi khi cập nhật Avatar",
      });
    }
  },
};
