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
        // Nhóm Stamina
        public float maxStaminaMult;
        public float staminaRegenMult;

        // Nhóm Items
        public float preserveItemChance;

        // Nhóm Nhìn thấu (Prophetic Sight)
        public float revealDuration;
        public bool revealOutline; // JSON là true/false nên phải dùng bool

        // Nhóm Cứu người (Relic Bearer)
        public float reviveSpeedMult;
        public float postReviveSpeedBoost;
        public float boostDuration;

        // --- Sếp có thể bổ sung thêm các biến khác ở đây nếu sau này tạo thêm Perk ---
        // VD: public float moveSpeedMult;
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