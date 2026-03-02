import Monster from "./monsterModel.js";

/**
 * Monster Controller
 * Xử lý các request liên quan đến quản lý quái vật
 */
export const MonsterController = {
  /**
   * GET /api/monsters
   * Lấy danh sách tất cả quái vật
   * Query params: 
   *   - page: số trang (mặc định 1)
   *   - limit: số lượng mỗi trang (mặc định 20)
   *   - isActive: lọc theo trạng thái (true/false/all)
   */
  getAllMonsters: async (req, res) => {
    try {
      const { page = 1, limit = 20, isActive = "all" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build query filter
      const filter = {};
      if (isActive !== "all") {
        filter.isActive = isActive === "true";
      }

      // Lấy dữ liệu với pagination
      const monsters = await Monster.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Đếm tổng số documents
      const total = await Monster.countDocuments(filter);

      return res.status(200).json({
        success: true,
        message: "Lấy danh sách quái vật thành công",
        data: monsters,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.getAllMonsters:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy danh sách quái vật",
        error: error.message,
      });
    }
  },

  /**
   * GET /api/monsters/:id
   * Lấy thông tin chi tiết một quái vật
   */
  getMonsterById: async (req, res) => {
    try {
      const { id } = req.params;

      const monster = await Monster.findById(id).select("-__v");

      if (!monster) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quái vật",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Lấy thông tin quái vật thành công",
        data: monster,
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.getMonsterById:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thông tin quái vật",
        error: error.message,
      });
    }
  },

  /**
   * POST /api/monsters
   * Tạo quái vật mới
   */
  createMonster: async (req, res) => {
    try {
      const { name, avatar, hp, atk, def, spawnRate } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Tên quái vật là bắt buộc",
        });
      }

      // Tạo monster mới
      const newMonster = new Monster({
        name,
        avatar,
        hp,
        atk,
        def,
        spawnRate,
      });

      await newMonster.save();

      return res.status(201).json({
        success: true,
        message: "Tạo quái vật thành công",
        data: newMonster,
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.createMonster:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi tạo quái vật",
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/monsters/:id
   * Cập nhật các chỉ số tĩnh của quái vật
   */
  updateMonster: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, avatar, hp, atk, def, spawnRate } = req.body;

      // Tìm monster
      const monster = await Monster.findById(id);

      if (!monster) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quái vật",
        });
      }

      // Validate input
      if (hp !== undefined && hp < 1) {
        return res.status(400).json({
          success: false,
          message: "HP phải lớn hơn 0",
        });
      }

      if (atk !== undefined && atk < 0) {
        return res.status(400).json({
          success: false,
          message: "ATK không được âm",
        });
      }

      if (def !== undefined && def < 0) {
        return res.status(400).json({
          success: false,
          message: "DEF không được âm",
        });
      }

      if (spawnRate !== undefined && (spawnRate < 0 || spawnRate > 100)) {
        return res.status(400).json({
          success: false,
          message: "Spawn Rate phải nằm trong khoảng 0-100",
        });
      }

      // Cập nhật các trường
      if (name !== undefined) monster.name = name;
      if (avatar !== undefined) monster.avatar = avatar;
      if (hp !== undefined) monster.hp = hp;
      if (atk !== undefined) monster.atk = atk;
      if (def !== undefined) monster.def = def;
      if (spawnRate !== undefined) monster.spawnRate = spawnRate;

      await monster.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật quái vật thành công",
        data: monster,
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.updateMonster:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật quái vật",
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/monsters/:id
   * Xóa quái vật (soft delete bằng cách set isActive = false)
   */
  deleteMonster: async (req, res) => {
    try {
      const { id } = req.params;

      const monster = await Monster.findById(id);

      if (!monster) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quái vật",
        });
      }

      // Soft delete
      monster.isActive = false;
      await monster.save();

      return res.status(200).json({
        success: true,
        message: "Xóa quái vật thành công",
        data: monster,
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.deleteMonster:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi xóa quái vật",
        error: error.message,
      });
    }
  },

  /**
   * PATCH /api/monsters/:id/status
   * Bật/tắt trạng thái active của quái vật
   */
  toggleMonsterStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive phải là giá trị boolean",
        });
      }

      const monster = await Monster.findById(id);

      if (!monster) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quái vật",
        });
      }

      monster.isActive = isActive;
      await monster.save();

      return res.status(200).json({
        success: true,
        message: `${isActive ? "Kích hoạt" : "Vô hiệu hóa"} quái vật thành công`,
        data: monster,
      });
    } catch (error) {
      console.error("❌ Error in MonsterController.toggleMonsterStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật trạng thái quái vật",
        error: error.message,
      });
    }
  },
};
