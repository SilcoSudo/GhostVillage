using UnityEngine;

namespace GhostVillage.Shop 
{
    public abstract class ShopItemSO : ScriptableObject, IShopItem {
        [Header("Backend Sync")]
        public string prefabId; 
        
        [Header("Display Info")]
        public string itemName;
        [TextArea(3, 5)]
        public string description;
        public Sprite icon;
        public ItemRarity rarity;
        public int price; // Thêm giá tiền vào đây để UI dùng chung

        public abstract ItemType GetItemType();
        
        // Thực thi interface IShopItem
        public string GetId() => prefabId;
        public string GetName() => itemName;
        public int GetPrice() => price;
    }
}