using System;
using System.Collections.Generic;

namespace Game.Domain.Perk.DTOs
{
    [Serializable]
    public class PlayerPerksResponseDTO
    {
        public bool success;
        public PlayerPerksData data;
    }

    [Serializable]
    public class PlayerPerksData
    {
        public int playerLevel;
        public int maxPerkSlots;
        public List<string> equippedPerks;
        public List<PerkDetailDTO> unlockedPerksDetails;
    }

    [Serializable]
    public class PerkDetailDTO
    {
        public string perkId;
        public string perkName;
        public string description;
        public string rarity;
        public string prefabId;
        public PerkModifiersDTO modifiers; // Map đúng cục JSON này
        public bool isEquipped;
    }

    // ==========================================
    // [QUAN TRỌNG] TÊN BIẾN PHẢI GIỐNG 100% VỚI MONGODB
    // ==========================================
    [Serializable]
    public class PerkModifiersDTO
    {
        // Nhóm Thể lực & Chạy
        public float maxStaminaMult;
        public float staminaRegenMult;
        public float sprintStaminaDrainMult; // Của Tire Tread Sandals (Sếp đang thiếu)

        // Nhóm Ancestral Vow (Buff khi Đồng đội bay màu) - Sếp đang thiếu sạch
        public float speedBoostPerDeath;
        public float staminaSavePerDeath;
        public int maxStacks;

        // Nhóm Sinh tồn & Tiêu hao Item
        public float preserveItemChance;
        public float batteryDrainMult;       // Của Gloom Eye (Sếp đang thiếu)
        public float bossDetectionRangeMult; // Của Agarwood Beads (Sếp đang thiếu)

        // Nhóm Nhìn thấu (Prophetic Sight)
        public float revealDuration;
        public bool revealOutline; // JSON là true/false nên phải dùng bool

        // Nhóm Cứu người (Relic Bearer)
        public float reviveSpeedMult;
        public float postReviveSpeedBoost;
        public float boostDuration;

        // Nhóm Tự Hồi sinh (Spectral Reflex) - Sếp đang thiếu sạch
        public int autoReviveCount;
        public float reviveDelay;
        public float reviveStaminaPercent;
    }

    [Serializable]
    public class EquipPerksRequest
    {
        public List<string> perks;
    }

    [Serializable]
    public class EquipPerkResponse
    {
        public bool success;
        public string message;
        public List<string> data;
    }

    [Serializable]
    public class EquipPerksResultDTO
    {
        public List<string> equippedPerks;
    }
}