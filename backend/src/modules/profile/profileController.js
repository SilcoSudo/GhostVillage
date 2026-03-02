// profileController.js
import profileService from "./profileService.js";
import { PlayerService } from '../player/playerService.js';

// GET /api/game/player/profile
export const getProfile = async (req, res, next) => {
  try {
    // Ưu tiên lấy ID từ Token (đã qua middleware xác thực)
    const userId = req.user?.id || req.query.userId; 

    if (!userId) {
      return res.status(400).json({ success: false, message: "Identification required" });
    }

    const data = await profileService.getBasicProfile(userId);

    if (!data) {
      return res.status(404).json({ success: false, message: "Player profile not found" });
    }

    // Trả về đúng format { success, data } để APIClient.cs parse được
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/game/player/match-history
export const getMatchHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const data = await profileService.getHistory(userId);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/game/player/achievements
export const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const data = await profileService.getAchievements(userId);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
// export const updateMedals = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     // Kiểm tra kỹ key này có khớp với Unity gửi lên không (medalCodes hay medalIds)
//     const { medalCodes, medalIds } = req.body; 
//     const finalCodes = medalCodes || medalIds;

//     if (!finalCodes) {
//       return res.status(400).json({ success: false, message: "No medals provided" });
//     }

//     // PlayerService bây giờ đã khả dụng nhờ import đúng path
//     const data = await PlayerService.updateSelectedMedals(userId, finalCodes); 
    
//     res.status(200).json({ success: true, data });
//   } catch (err) {
//     // Trả về lỗi 400 để Unity log được message cụ thể
//     res.status(400).json({ success: false, message: err.message });
//   }
// };
export const updateMedals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { medalCodes } = req.body;
    const updatedMedals = await PlayerService.updateSelectedMedals(userId, medalCodes);
    
    // Đảm bảo trả về key là "data"
    res.status(200).json({ success: true, data: updatedMedals }); 
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};