using System;
using System.Collections.Generic;

namespace GhostVillage.Shop
{
    // 1. DTO CHO GET /shop (Load danh sách cửa hàng)
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
        public List<CosmeticDTO> cosmetics;
        public List<PerkDTO> perks;
        public string expiresAt;
    }

    [Serializable]
    public class CosmeticDTO
    {
        public string _id;
        public string name;
        public string description;
        public string type;
        public int price;
        public string rarity;
        public string prefabId;
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

    // 2. DTO CHO POST /buy (Mua vật phẩm)
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
        public List<string> unlockedItems;
    }

    // 3. DTO CHO PUT /player/equip-skin (Mặc đồ)
    [Serializable]
    public class EquipApiResponse
    {
        public bool success;
        public EquipDataDTO data; 
        public string message;
    }

    [Serializable]
    public class EquipDataDTO
    {
        public string head;
        public string body;
    }

    [Serializable]
    public class BuyRequestDTO 
    {
        public string itemId;
        public string itemType;
    }

    [Serializable]
    public class EquipRequestDTO 
    {
        public string head;
        public string body;
    }
}