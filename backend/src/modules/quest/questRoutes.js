import express from "express";
import { QuestController } from "./questController.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// GET /api/quests/stats/summary (Phải đặt trước /:id)
router.get("/stats/summary", QuestController.getQuestStats);

// GET /api/quests
router.get("/", QuestController.getAllQuests);

// GET /api/quests/:id (hỗ trợ questId hoặc _id)
router.get("/:id", QuestController.getQuestById);

// POST /api/quests
router.post("/", QuestController.createQuest);

// PUT /api/quests/:id
router.put("/:id", QuestController.updateQuest);

// PATCH /api/quests/:id/status
router.patch("/:id/status", QuestController.toggleQuestStatus);

// DELETE /api/quests/:id
router.delete("/:id", QuestController.deleteQuest);

export default router;
