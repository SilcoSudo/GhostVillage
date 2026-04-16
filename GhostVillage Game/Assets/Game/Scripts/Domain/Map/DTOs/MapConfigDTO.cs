using System;
using System.Collections.Generic;

namespace Game.Domain.Map.DTOs
{
    // --- LỚP VỎ BỌC NGOÀI CÙNG (Hứng từ /api/maps/:id/game-data) ---
    [Serializable]
    public class AggregatedGameDataDTO
    {
        public MapConfigDTO mapConfig;
        public GameStatsDTO stats;
    }

    [Serializable]
    public class GameStatsDTO
    {
        public List<MonsterStatDTO> monsters;
        public List<ItemStatDTO> items;
        public List<MoonEventGlobalDTO> moonEvents;
    }

    // --- CÁC CLASS HỨNG CHỈ SỐ ---
    [Serializable]
    public class MonsterStatDTO
    {
        public string monsterId;
        public string monsterName;
        public string monsterType;
        public string prefabName;
        // Bro có thể định nghĩa thêm MovementConfigDTO, CombatConfigDTO ở đây để lấy stats
    }

    [Serializable]
    public class ItemStatDTO
    {
        public string itemId;
        public string itemName;
        public string itemType;
        public string prefabName;
        // Không còn maxStack nữa
        // stats có thể để kiểu string (raw json) hoặc định nghĩa class cụ thể nếu bro muốn deserialize sâu
    }

    [Serializable]
    public class MoonEventGlobalDTO
    {
        public string eventId;
        public string eventName; // Chú ý: Backend dùng eventName thay vì displayName
        public string uiIcon;
        public int weight;

        // --- THÊM 3 CỤC NÀY ĐỂ HỨNG DATA TỪ SERVER ---
        public EnvironmentModifiersDTO environmentModifiers;
        public MonsterBuffMultipliersDTO monsterBuffMultipliers;
        public RewardMultipliersDTO rewardMultipliers;
    }

    [Serializable]
    public class EnvironmentModifiersDTO
    {
        public float globalLightIntensity;
        public float fogDensity;
    }

    [Serializable]
    public class MonsterBuffMultipliersDTO
    {
        public float speedMultiplier;
        public float detectionRangeMultiplier;
        public float chaseRangeMultiplier;
        public float cooldownMultiplier;
    }

    [Serializable]
    public class RewardMultipliersDTO
    {
        public float expMultiplier;
        public float coinMultiplier;
    }

    // --- MAP CONFIG (Đã ép cân sạch sẽ) ---
    [Serializable]
    public class MapConfigDTO
    {
        public IdentityConfigDTO identityConfig;
        public ConsumableConfigDTO consumableConfig;
        public EquipmentConfigDTO equipmentConfig;
        public MonsterSystemConfigDTO monsterSystemConfig;
        public PuzzleConfigDTO puzzleConfig;
        public RewardConfigDTO rewardConfig;
    }

    [Serializable]
    public class IdentityConfigDTO
    {
        public string mapId;
        public string sceneName;
        public string displayName;
        public string thumbnailUrl;
        public string shortDescription;
        public bool isActive;
    }

    [Serializable]
    public class ConsumableConfigDTO
    {
        public List<MandatoryItemDTO> mandatoryItems;
        public RandomPoolConfigDTO randomPoolConfig;
    }

    [Serializable]
    public class EquipmentConfigDTO
    {
        public List<MandatoryItemDTO> mandatoryEquipment;
        public RandomPoolConfigDTO randomPoolConfig;
    }

    [Serializable]
    public class MandatoryItemDTO
    {
        public string itemId;
        public int minCount;
        public int maxCount;
    }

    [Serializable]
    public class RandomPoolConfigDTO
    {
        public int minCount;
        public int maxCount;
        public List<ItemWeightDTO> pool;
    }

    [Serializable]
    public class ItemWeightDTO
    {
        public string itemId;
        public int weight;
    }

    [Serializable]
    public class MonsterSystemConfigDTO
    {
        public BossConfigDTO bossConfig;
        public MinionConfigDTO minionConfig;
    }

    [Serializable]
    public class BossConfigDTO
    {
        public string monsterId;
    }

    [Serializable]
    public class MinionConfigDTO
    {
        public List<string> allowedMonsterIds;
    }

    [Serializable]
    public class PuzzleConfigDTO
    {
        public List<string> puzzlePoolIds;
    }

    [Serializable]
    public class RewardConfigDTO
    {
        public int baseExp;
        public int baseCoin;
    }
}