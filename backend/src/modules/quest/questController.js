import Quest from "./questModel.js";
import { logActivity } from "../activityLog/activityLogController.js";

/**
 * Quest Controller
 * Xử lý các request liên quan đến quản lý nhiệm vụ (Quest Management)
 */
export const QuestController = {
  /**
   * GET /api/quests
   * Lấy danh sách tất cả quest
   * Query params:
   *   - page: số trang (mặc định 1)
   *   - limit: số lượng mỗi trang (mặc định 20)
   *   - isActive: lọc theo trạng thái (true/false/all)
   *   - questLine: lọc theo loại quest (Main Story/Side Quest/Daily/etc.)
   *   - difficulty: lọc theo độ khó (Easy/Medium/Hard/etc.)
   *   - search: tìm kiếm theo title/description
   */
  getAllQuests: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        isActive = "all",
        questLine,
        difficulty,
        search,
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build query filter
      const filter = {};

      if (isActive !== "all") {
        filter.isActive = isActive === "true";
      }

      if (questLine && questLine !== "all") {
        filter.questLine = questLine;
      }

      if (difficulty && difficulty !== "all") {
        filter.difficulty = difficulty;
      }

      if (search) {
        filter.$text = { $search: search };
      }

      // Lấy dữ liệu với pagination
      const quests = await Quest.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Đếm tổng số documents
      const total = await Quest.countDocuments(filter);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách quest thành công",
        data: quests,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("❌ Error in QuestController.getAllQuests:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy danh sách quest",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/quests/:id
   * Lấy thông tin chi tiết một quest
   * Params: id có thể là MongoDB _id hoặc questId (QUEST_XXX)
   */
  getQuestById: async (req, res) => {
    try {
      const { id } = req.params;

      // Tìm theo _id hoặc questId
      let quest;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        // MongoDB ObjectId
        quest = await Quest.findById(id).select("-__v");
      } else {
        // questId (QUEST_XXX)
        quest = await Quest.findOne({ questId: id.toUpperCase() }).select("-__v");
      }

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quest",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin quest thành công",
        data: quest,
      });
    } catch (error) {
      console.error("❌ Error in QuestController.getQuestById:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thông tin quest",
        error: error.message,
      });
    }
  },

  /**
   * POST /api/quests
   * Tạo quest mới
   */
  createQuest: async (req, res) => {
    try {
      const {
        questId,
        title,
        description,
        story,
        questLine,
        chapter,
        prerequisites,
        objectives,
        rewards,
        difficulty,
        levelRequired,
        timeLimit,
        isRepeatable,
        cooldown,
        npcGiver,
        location,
        tags,
      } = req.body;

      // Validate required fields
      if (!questId) {
        return res.status(400).json({
          success: false,
          message: "Quest ID là bắt buộc",
        });
      }

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Tiêu đề quest là bắt buộc",
        });
      }

      if (!objectives || objectives.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Quest phải có ít nhất 1 objective",
        });
      }

      // Kiểm tra questId đã tồn tại chưa
      const existingQuest = await Quest.findOne({ questId: questId.toUpperCase() });
      if (existingQuest) {
        return res.status(409).json({
          success: false,
          message: `Quest ID "${questId}" đã tồn tại`,
        });
      }

      // Tạo quest mới
      const newQuest = new Quest({
        questId: questId.toUpperCase(),
        title,
        description,
        story,
        questLine,
        chapter,
        prerequisites,
        objectives,
        rewards: rewards || { exp: 0, coin: 0, items: [], titles: [] },
        difficulty,
        levelRequired,
        timeLimit,
        isRepeatable,
        cooldown,
        npcGiver,
        location,
        tags,
      });

      await newQuest.save();

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "CREATE",
        entityType: "QUEST",
        entityId: newQuest._id,
        entityName: newQuest.questId,
        description: `Tạo quest: ${newQuest.title} (${newQuest.questId})`,
        severity: "LOW",
        metadata: { questId, title, questLine },
        req,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo quest thành công",
        data: newQuest,
      });
    } catch (error) {
      console.error("❌ Error in QuestController.createQuest:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi tạo quest",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/quests/:id
   * Cập nhật thông tin quest (objectives, rewards, quest lines)
   */
  updateQuest: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Tìm quest theo _id hoặc questId
      let quest;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        quest = await Quest.findById(id);
      } else {
        quest = await Quest.findOne({ questId: id.toUpperCase() });
      }

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quest",
        });
      }

      // Không cho phép thay đổi questId
      if (updateData.questId && updateData.questId !== quest.questId) {
        return res.status(400).json({
          success: false,
          message: "Không thể thay đổi Quest ID",
        });
      }

      // Update allowed fields
      const allowedUpdates = [
        "title",
        "description",
        "story",
        "questLine",
        "chapter",
        "prerequisites",
        "objectives",
        "rewards",
        "difficulty",
        "levelRequired",
        "timeLimit",
        "isRepeatable",
        "cooldown",
        "npcGiver",
        "location",
        "tags",
      ];

      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          quest[field] = updateData[field];
        }
      });

      await quest.save();

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "UPDATE",
        entityType: "QUEST",
        entityId: quest._id,
        entityName: quest.questId,
        description: `Cập nhật quest: ${quest.title} (${quest.questId})`,
        severity: "LOW",
        metadata: { updateData },
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Cập nhật quest thành công",
        data: quest,
      });
    } catch (error) {
      console.error("❌ Error in QuestController.updateQuest:", error);

      // Handle validation errors
      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật quest",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/quests/:id/status
   * Toggle trạng thái active/inactive của quest
   */
  toggleQuestStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      // Tìm quest
      let quest;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        quest = await Quest.findById(id);
      } else {
        quest = await Quest.findOne({ questId: id.toUpperCase() });
      }

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quest",
        });
      }

      // Toggle hoặc set theo giá trị được truyền vào
      quest.isActive = isActive !== undefined ? isActive : !quest.isActive;
      await quest.save();

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "TOGGLE_STATUS",
        entityType: "QUEST",
        entityId: quest._id,
        entityName: quest.questId,
        description: `${quest.isActive ? "Kích hoạt" : "Vô hiệu hóa"} quest: ${quest.title} (${quest.questId})`,
        severity: "LOW",
        metadata: { isActive: quest.isActive },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `Quest đã được ${quest.isActive ? "kích hoạt" : "vô hiệu hóa"}`,
        data: {
          questId: quest.questId,
          title: quest.title,
          isActive: quest.isActive,
        },
      });
    } catch (error) {
      console.error("❌ Error in QuestController.toggleQuestStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi thay đổi trạng thái quest",
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/quests/:id
   * Xóa quest (hard delete - cần cẩn thận)
   */
  deleteQuest: async (req, res) => {
    try {
      const { id } = req.params;

      // Tìm và xóa quest
      let quest;
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        quest = await Quest.findByIdAndDelete(id);
      } else {
        quest = await Quest.findOneAndDelete({ questId: id.toUpperCase() });
      }

      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quest",
        });
      }

      // Log activity
      await logActivity({
        userId: req.user?._id,
        username: req.user?.username || req.user?.email,
        action: "DELETE",
        entityType: "QUEST",
        entityId: quest._id,
        entityName: quest.questId,
        description: `Xóa quest: ${quest.title} (${quest.questId})`,
        severity: "HIGH",
        metadata: { deletedQuest: quest },
        req,
      });

      return res.status(200).json({
        success: true,
        message: "Xóa quest thành công",
        data: {
          questId: quest.questId,
          title: quest.title,
        },
      });
    } catch (error) {
      console.error("❌ Error in QuestController.deleteQuest:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi xóa quest",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/quests/stats/summary
   * Lấy thống kê tổng quan về quests
   */
  getQuestStats: async (req, res) => {
    try {
      const [
        totalQuests,
        activeQuests,
        inactiveQuests,
        questsByLine,
        questsByDifficulty,
      ] = await Promise.all([
        Quest.countDocuments(),
        Quest.countDocuments({ isActive: true }),
        Quest.countDocuments({ isActive: false }),
        Quest.aggregate([
          { $group: { _id: "$questLine", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Quest.aggregate([
          { $group: { _id: "$difficulty", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

      return res.status(200).json({
        success: true,
        message: "Lấy thống kê quest thành công",
        data: {
          total: totalQuests,
          active: activeQuests,
          inactive: inactiveQuests,
          byQuestLine: questsByLine,
          byDifficulty: questsByDifficulty,
        },
      });
    } catch (error) {
      console.error("❌ Error in QuestController.getQuestStats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thống kê quest",
        error: error.message,
      });
    }
  },
};
