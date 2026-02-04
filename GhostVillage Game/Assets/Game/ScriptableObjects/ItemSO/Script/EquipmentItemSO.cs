using UnityEngine;

[CreateAssetMenu(fileName = "NewEquipment", menuName = "Game/Inventory/Equipment Item")]
public class EquipmentItemSO : ItemDataSO
{
    private void OnEnable() => itemType = ItemType.Equipment;

    public override bool OnUse(GameObject character)
    {
        // TODO: Sau này code logic bật/tắt đèn
        Debug.Log($"Đã kích hoạt thiết bị: {itemName}");
        return false; // Trả về false để KHÔNG xóa item khỏi túi
    }
}