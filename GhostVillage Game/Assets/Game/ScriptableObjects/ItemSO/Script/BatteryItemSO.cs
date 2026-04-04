using UnityEngine;

[CreateAssetMenu(fileName = "NewBattery", menuName = "Game Data/Items/Battery")]
public class BatteryItemSO : ItemDataSO
{
    [Header("Battery Stats (Từ DB)")]
    public float rechargeAmount = 50f;

    private void OnEnable()
    {
        itemType = ItemType.Consumable;
        holdType = HoldType.OneHand; // Nhét túi hoặc cầm 1 tay tùy sếp
    }

    public override bool OnUse(GameObject character)
    {
        return true;
    }
}