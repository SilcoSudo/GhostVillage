using UnityEngine;

[CreateAssetMenu(fileName = "NewKeyItem", menuName = "Game/Inventory/Key Item")]
public class KeyItemSO : ItemDataSO
{
    private void OnEnable() => itemType = ItemType.KeyItem;
}