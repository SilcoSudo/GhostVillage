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

export const equipSkin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { head, body } = req.body; // Client gửi lên json: { "head": "SO_Hat_Straw" }

    const updatedEquipped = await PlayerService.updateEquippedSkins(userId, head, body);
    
    res.status(200).json({ success: true, data: updatedEquipped });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};