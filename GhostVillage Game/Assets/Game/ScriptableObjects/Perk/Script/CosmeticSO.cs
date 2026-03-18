using UnityEngine;

namespace GhostVillage.Shop 
{
    [CreateAssetMenu(fileName = "NewCosmetic", menuName = "GhostVillage/Shop/Cosmetic")]
    public class CosmeticSO : ShopItemSO {
        public CosmeticType cosmeticType;

        [Header("Preview Settings")]
        [Tooltip("Tên Object con trong Model nhân vật (dùng cho Body)")]
        public string modelGameObjectName; 
        
        [Tooltip("Prefab nón để gắn vào HatAnchor (dùng cho Hat)")]
        public GameObject hatPrefab; 

        public override ItemType GetItemType() => ItemType.COSMETIC;
    }
}