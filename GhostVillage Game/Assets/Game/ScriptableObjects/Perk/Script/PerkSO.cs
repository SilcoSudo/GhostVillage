using UnityEngine;

namespace GhostVillage.Shop
{
    [CreateAssetMenu(fileName = "NewPerk", menuName = "GhostVillage/Shop/Perk")]
    public class PerkSO : ShopItemSO
    {
        public override ItemType GetItemType() => ItemType.PERK;
    }
}