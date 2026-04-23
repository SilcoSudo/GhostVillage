import MapConfig from "./mapConfigModel.js";
import Monster from "../monster/monsterModel.js";
import Item from "../item/itemModel.js";
import Quest from "../quest/questModel.js";
import Perk from "../perk/perkModel.js";
import MoonEvent from "../moonEvent/moonEventModel.js";

export const MapService = {
  getAllMaps: async (query) => {
    const { isActive = "true" } = query;
    let filter = {};
    if (isActive !== "all") {
      filter["identityConfig.isActive"] = isActive === "true";
    }
    return await MapConfig.find(filter)
      .sort({ "identityConfig.displayName": 1 })
      .lean();
  },

  getMapById: async (id) => {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      return await MapConfig.findById(id).lean();
    }
    return await MapConfig.findOne({
      "identityConfig.mapId": id.toUpperCase(),
    }).lean();
  },

  toggleMapStatus: async (id, isActive) => {
    const map = await MapConfig.findById(id);
    if (!map) throw new Error("Không tìm thấy map");
    map.identityConfig.isActive = isActive;
    return await map.save();
  },

  updateMapMetadata: async (id, updateData) => {
    const map = await MapConfig.findById(id);
    if (!map) throw new Error("Không tìm thấy map");

    const identity = updateData.identityConfig || {};
    const consumable = updateData.consumableConfig || {};
    const equipment = updateData.equipmentConfig || {};
    const monsterSystem = updateData.monsterSystemConfig || {};
    const reward = updateData.rewardConfig || {};

    // Backward-compatible flat metadata updates
    if (updateData.displayName !== undefined)
      map.identityConfig.displayName = updateData.displayName;
    if (updateData.shortDescription !== undefined)
      map.identityConfig.shortDescription = updateData.shortDescription;
    if (updateData.thumbnailUrl !== undefined)
      map.identityConfig.thumbnailUrl = updateData.thumbnailUrl;
    if (updateData.sceneName !== undefined)
      map.identityConfig.sceneName = updateData.sceneName;

    // Identity config updates
    if (identity.displayName !== undefined)
      map.identityConfig.displayName = identity.displayName;
    if (identity.sceneName !== undefined)
      map.identityConfig.sceneName = identity.sceneName;
    if (identity.shortDescription !== undefined)
      map.identityConfig.shortDescription = identity.shortDescription;
    if (identity.thumbnailUrl !== undefined)
      map.identityConfig.thumbnailUrl = identity.thumbnailUrl;
    if (identity.isActive !== undefined)
      map.identityConfig.isActive = !!identity.isActive;

    // Reward config updates
    if (reward.baseExp !== undefined) {
      if (Number(reward.baseExp) < 0) throw new Error("baseExp không được âm");
      map.rewardConfig.baseExp = Number(reward.baseExp);
    }
    if (reward.baseCoin !== undefined) {
      if (Number(reward.baseCoin) < 0)
        throw new Error("baseCoin không được âm");
      map.rewardConfig.baseCoin = Number(reward.baseCoin);
    }

    // Consumable config updates
    if (Array.isArray(consumable.mandatoryItems)) {
      map.consumableConfig.mandatoryItems = consumable.mandatoryItems.map(
        (item) => ({
          itemId: item.itemId,
          minCount: Number(item.minCount || 0),
          maxCount: Number(item.maxCount || 0),
        }),
      );
    }
    if (consumable.randomPoolConfig) {
      const cfg = consumable.randomPoolConfig;
      if (cfg.minCount !== undefined)
        map.consumableConfig.randomPoolConfig.minCount = Number(cfg.minCount);
      if (cfg.maxCount !== undefined)
        map.consumableConfig.randomPoolConfig.maxCount = Number(cfg.maxCount);
      if (Array.isArray(cfg.pool)) {
        map.consumableConfig.randomPoolConfig.pool = cfg.pool.map((item) => ({
          itemId: item.itemId,
          weight: Number(item.weight || 0),
        }));
      }
    }

    // Equipment config updates
    if (Array.isArray(equipment.mandatoryEquipment)) {
      map.equipmentConfig.mandatoryEquipment = equipment.mandatoryEquipment.map(
        (item) => ({
          itemId: item.itemId,
          minCount: Number(item.minCount || 0),
          maxCount: Number(item.maxCount || 0),
        }),
      );
    }
    if (equipment.randomPoolConfig) {
      const cfg = equipment.randomPoolConfig;
      if (cfg.minCount !== undefined)
        map.equipmentConfig.randomPoolConfig.minCount = Number(cfg.minCount);
      if (cfg.maxCount !== undefined)
        map.equipmentConfig.randomPoolConfig.maxCount = Number(cfg.maxCount);
      if (Array.isArray(cfg.pool)) {
        map.equipmentConfig.randomPoolConfig.pool = cfg.pool.map((item) => ({
          itemId: item.itemId,
          weight: Number(item.weight || 0),
        }));
      }
    }

    // Monster config updates
    if (monsterSystem.bossConfig) {
      if (monsterSystem.bossConfig.monsterId !== undefined) {
        map.monsterSystemConfig.bossConfig.monsterId =
          monsterSystem.bossConfig.monsterId;
      }
    }
    if (monsterSystem.minionConfig) {
      if (Array.isArray(monsterSystem.minionConfig.allowedMonsterIds)) {
        map.monsterSystemConfig.minionConfig.allowedMonsterIds =
          monsterSystem.minionConfig.allowedMonsterIds;
      }
    }

    return await map.save();
  },

  createMap: async (data) => {
    // Kiểm tra trùng mapId
    const existingMap = await MapConfig.findOne({
      "identityConfig.mapId": data.identityConfig.mapId,
    });
    if (existingMap) {
      throw new Error(`Map ID "${data.identityConfig.mapId}" đã tồn tại!`);
    }

    const newMap = new MapConfig(data);
    return await newMap.save();
  },

  /**
   * TRẠM TRỘN DATA: Gộp data của 5 bảng dựa trên Map ID
   * Hàm này sẽ được Unity gọi khi load cảnh để lấy toàn bộ Game Data
   */
  /**
   * TRẠM TRỘN DATA (MEGA DTO)
   */
  getAggregatedGameData: async (mapId) => {
    // 1. Lấy MapConfig để Spawner của Unity biết đường rải đồ
    const mapConfig = await MapConfig.findOne({
      "identityConfig.mapId": mapId.toUpperCase(),
    }).lean();
    if (!mapConfig) throw new Error("Không tìm thấy Map");

    // 2. Gom toàn bộ ID Item cần lấy chỉ số
    const itemIds = [
      ...(mapConfig.consumableConfig?.mandatoryItems?.map((i) => i.itemId) ||
        []),
      ...(mapConfig.consumableConfig?.randomPoolConfig?.pool?.map(
        (i) => i.itemId,
      ) || []),
      ...(mapConfig.equipmentConfig?.mandatoryEquipment?.map((i) => i.itemId) ||
        []),
      ...(mapConfig.equipmentConfig?.randomPoolConfig?.pool?.map(
        (i) => i.itemId,
      ) || []),
    ];

    // Gom ID Monster
    const bossId = mapConfig.monsterSystemConfig?.bossConfig?.monsterId;
    const minionIds =
      mapConfig.monsterSystemConfig?.minionConfig?.allowedMonsterIds || [];
    const monsterIds = bossId ? [bossId, ...minionIds] : minionIds;

    // 3. Fetch toàn bộ chỉ số từ DB song song
    const [monsters, items, globalMoonEvents] = await Promise.all([
      Monster.find({ monsterId: { $in: monsterIds }, isActive: true })
        .select("-_id -__v")
        .lean(),
      Item.find({ itemId: { $in: itemIds }, isActive: true })
        .select("-_id -__v")
        .lean(),
      MoonEvent.find({ isActive: true }).select("-_id -__v").lean(), // Lấy TẤT CẢ trăng đang bật (Global)
    ]);

    // 4. Đóng gói Mega DTO khớp 100% C#
    return {
      // Dành cho các SpawnerManager đọc luật chơi
      mapConfig: mapConfig,

      // Dành cho GameObject (Quái, Đồ) nạp chỉ số
      stats: {
        monsters: monsters,
        items: items,
        moonEvents: globalMoonEvents,
      },
    };
  },
};
