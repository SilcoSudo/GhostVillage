using System;
using System.Collections.Generic;

namespace Game.Domain.Map.DTOs
{
    [Serializable]
    public class MapConfigDTO
    {
        public IdentityConfigDTO identityConfig;
        public EnvironmentConfigDTO environmentConfig;
        public ConsumableConfigDTO consumableConfig;
        public EquipmentConfigDTO equipmentConfig; // <-- MỚI THÊM
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
    public class EnvironmentConfigDTO
    {
        public string baseLightingId;
        public List<MoonEventDTO> moonEventPool;
    }

    [Serializable]
    public class MoonEventDTO
    {
        public string eventId;
        public int weight;
        public string uiIcon;
    }

    [Serializable]
    public class ConsumableConfigDTO
    {
        public List<string> spawnPointIds;
        public List<MandatoryItemDTO> mandatoryItems;
        public RandomPoolConfigDTO randomPoolConfig;
    }

    // --- MỚI THÊM CLASS NÀY ---
    [Serializable]
    public class EquipmentConfigDTO
    {
        public List<string> spawnPointIds;
        // Tái sử dụng MandatoryItemDTO vì cấu trúc JSON giống hệt (itemId, min, max)
        public List<MandatoryItemDTO> mandatoryEquipment;
        // Tái sử dụng RandomPoolConfigDTO vì cấu trúc JSON giống hệt
        public RandomPoolConfigDTO randomPoolConfig;
    }
    // ---------------------------

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
        public List<string> spawnPointIds;
    }

    [Serializable]
    public class MinionConfigDTO
    {
        public List<string> allowedMonsterIds;
        public List<string> spawnPointIds;
    }

    [Serializable]
    public class PuzzleConfigDTO
    {
        public List<string> spawnPointIds;
        public List<string> puzzlePoolIds;
    }

    [Serializable]
    public class RewardConfigDTO
    {
        public int baseExp;
        public int baseCoin;
        public List<EventMultiplierDTO> eventMultipliers;
    }

    [Serializable]
    public class EventMultiplierDTO
    {
        public string eventId;
        public float coinMultiplier;
        public float expMultiplier;
    }
}