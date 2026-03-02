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

        [Header("Consumables & Equipments")]
        public List<ResourceEntry> items;

        [Header("Monsters")]
        public List<ResourceEntry> monsters;

        [Header("Puzzles")]
        public List<ResourceEntry> puzzles;

        // --- HÀM TÌM KIẾM NHANH ---
        public GameObject GetPrefabById(string id)
        {
            // Tìm trong items
            var item = items.Find(x => x.entityId == id);
            if (item != null && item.prefab != null) return item.prefab;

            // Tìm trong monsters
            var monster = monsters.Find(x => x.entityId == id);
            if (monster != null && monster.prefab != null) return monster.prefab;

            // Tìm trong puzzles
            var puzzle = puzzles.Find(x => x.entityId == id);
            if (puzzle != null && puzzle.prefab != null) return puzzle.prefab;

            Debug.LogError($"❌ [ResourceDB] KHÔNG TÌM THẤY PREFAB CHO ID: {id}. Vui lòng check lại Scriptable Object!");
            return null;
        }
    }
}