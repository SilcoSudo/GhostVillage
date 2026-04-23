using System;
using System.Collections.Generic;

namespace GhostVillage.Shop
{
    // 1. DTO CHO GET /shop
    [Serializable]
    public class ShopApiResponse
    {
        public bool success;
        public ShopDataDTO data;
        public string message;
    }

    [Serializable]
    public class ShopDataDTO
    {
        public List<PerkDTO> perks;
        public string expiresAt;
        public int coin;
    }

    [Serializable]
    public class PerkDTO
    {
        public string _id;
        public string name;
        public string description;
        public int price;
        public string rarity;
        public string prefabId;
    }

    // 2. DTO CHO POST /buy (Mua Perk)
    [Serializable]
    public class BuyApiResponse
    {
        public bool success;
        public BuyDataDTO data;
        public string message;
    }

    [Serializable]
    public class BuyDataDTO
    {
        public int newBalance;
        public List<string> unlockedItems; // Danh sách ID đã mở khóa sau khi mua
    }

    [Serializable]
    public class BuyRequestDTO 
    {
        public string itemId;
        public string itemType;
    }
}