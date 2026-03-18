import { PlayerService } from './playerService.js';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ authMiddleware
    const data = await PlayerService.getFullProfileData(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};