import mongoose from "mongoose";
import Player from "../player/playerModel.js";
import UserMatchHistory from "./playerMatchHistoryModel.js";
import UserAchievement from "./playerAchievementModel.js";
// GET /api/profile?userId=...
export const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const player = await Player.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!player) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: player.userId,
        profile: player.profile,
        inventory: player.inventory,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/profile/match-history?userId=...
export const getMatchHistory = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const items = await UserMatchHistory.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { items, nextCursor: null },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/profile/achievements?userId=...
export const getAchievements = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    const items = await UserAchievement.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { items },
    });
  } catch (err) {
    next(err);
  }
};
