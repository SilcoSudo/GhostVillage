using UnityEngine;

[CreateAssetMenu(fileName = "NewConsumable", menuName = "Game/Inventory/Consumable Item")]
public class ConsumableItemSO : ItemDataSO
{
    [Header("Consumable Stats")]
    public int healAmount = 0;
    public float staminaAmount = 0;

    private void OnEnable() => itemType = ItemType.Consumable;

    public override bool OnUse(GameObject character)
    {
        // TODO: Sau này sẽ code logic hồi máu ở đây
        Debug.Log($"Đã uống {itemName}. Hồi {healAmount} máu.");
        return true; // Trả về true để báo Inventory xóa item này đi
    }
}