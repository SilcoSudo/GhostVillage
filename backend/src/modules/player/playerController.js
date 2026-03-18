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
    const { head, body } = req.body; 
    const updatedEquipped = await PlayerService.updateEquippedSkins(userId, head, body);
    
    res.status(200).json({ success: true, data: updatedEquipped });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const equipPerks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { perks } = req.body; // JSON: { "perks": ["PERK_Runner_1", "PERK_Stam_1"] }
    const updatedPerks = await PlayerService.updateEquippedPerks(userId, perks);
    
    res.status(200).json({ success: true, data: updatedPerks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};