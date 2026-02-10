using UnityEngine;

[CreateAssetMenu(fileName = "NewKeyItem", menuName = "Game/Inventory/Key Item")]
public class KeyItemSO : ItemDataSO
{
    private void OnEnable() => itemType = ItemType.KeyItem;

    public override bool OnUse(GameObject character)
    {
        Debug.Log($"Key Item '{itemName}' không thể sử dụng trực tiếp. Hãy tìm đúng chỗ để dùng!");
        return false; // Không xóa khỏi túi
    }
}