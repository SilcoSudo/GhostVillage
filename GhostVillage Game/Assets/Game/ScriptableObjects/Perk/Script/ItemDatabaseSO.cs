using System.Collections.Generic;
using UnityEngine;

namespace GhostVillage.Shop 
{
    [CreateAssetMenu(fileName = "ItemDatabase", menuName = "GhostVillage/Shop/Database")]
    public class ItemDatabaseSO : ScriptableObject {
        public List<ShopItemSO> allItems;

        // Tìm bất kỳ món nào theo ID
        public ShopItemSO GetItemById(string id) {
            return allItems.Find(item => item.prefabId == id);
        }

        // Hàm tiện ích: Lấy riêng danh sách Perk từ kho chung
        public List<T> GetItemsByType<T>() where T : ShopItemSO {
            List<T> results = new List<T>();
            foreach (var item in allItems) {
                if (item is T typedItem) results.Add(typedItem);
            }
            return results;
        }
    }
}