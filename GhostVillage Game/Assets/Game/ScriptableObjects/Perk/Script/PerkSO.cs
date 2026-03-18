using UnityEngine;

namespace GhostVillage.Shop
{
    [CreateAssetMenu(fileName = "NewPerk", menuName = "GhostVillage/Shop/Perk")]
    public class PerkSO : ShopItemSO
    {
        // Bạn có thể thêm các thông số kỹ năng riêng của Perk ở đây
        [Header("Perk Stats")]
        public float value; 

        public override ItemType GetItemType() => ItemType.PERK;
    }
}