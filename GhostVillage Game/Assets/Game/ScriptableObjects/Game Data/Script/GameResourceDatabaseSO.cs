using UnityEngine;
using System.Collections.Generic;

namespace Game.Core.Database
{
    [CreateAssetMenu(fileName = "GameResourceDatabase", menuName = "Game Data/Resource Database")]
    public class GameResourceDatabaseSO : ScriptableObject
    {
        [System.Serializable]
        public class ResourceEntry
        {
            public string entityId; // Khớp với DB (VD: ITEM_FLASHLIGHT)
            public GameObject prefab;
        }

        [Header("--- Consumables (Vật phẩm tiêu hao) ---")]
        [Tooltip("Những món bắt buộc phải có trên map")]
        public List<ResourceEntry> mandatoryConsumables;
        [Tooltip("Những món xuất hiện hên xui")]
        public List<ResourceEntry> randomConsumables;

        [Header("--- Equipments (Trang bị) ---")]
        [Tooltip("Trang bị bắt buộc phải có")]
        public List<ResourceEntry> mandatoryEquipments;
        [Tooltip("Trang bị xuất hiện hên xui")]
        public List<ResourceEntry> randomEquipments;

        [Header("--- Monsters ---")]
        public List<ResourceEntry> monsters;

        [Header("--- Puzzles ---")]
        public List<ResourceEntry> puzzles;

        // --- HÀM TÌM KIẾM NHANH ---
        public GameObject GetPrefabById(string id)
        {
            // 1. Gộp tất cả các list chứa Item/Equipment lại để tìm kiếm một lượt
            List<ResourceEntry>[] allItemLists = {
                mandatoryConsumables, randomConsumables,
                mandatoryEquipments, randomEquipments
            };

            foreach (var list in allItemLists)
            {
                if (list == null) continue; // Tránh lỗi NullReference nếu list chưa được khởi tạo trên Inspector

                var foundItem = list.Find(x => x.entityId == id);
                if (foundItem != null && foundItem.prefab != null)
                    return foundItem.prefab;
            }

            // 2. Tìm trong monsters
            var monster = monsters.Find(x => x.entityId == id);
            if (monster != null && monster.prefab != null) return monster.prefab;

            // 3. Tìm trong puzzles
            var puzzle = puzzles.Find(x => x.entityId == id);
            if (puzzle != null && puzzle.prefab != null) return puzzle.prefab;

            // Nếu quét hết tất cả mọi nơi mà vẫn không thấy
            Debug.LogError($" [ResourceDB] KHÔNG TÌM THẤY PREFAB CHO ID: {id}. Vui lòng check lại Scriptable Object!");
            return null;
        }
    }
}