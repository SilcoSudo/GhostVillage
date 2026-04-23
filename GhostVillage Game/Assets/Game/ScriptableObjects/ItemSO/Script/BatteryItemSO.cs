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

    // ĐƯA TOÀN BỘ LOGIC SẠC PIN VÀO ĐÂY
    // GHI ĐÈ LẠI HÀM NÀY TRONG FILE BatteryItemSO.cs
    public override bool OnUse(GameObject character)
    {
        var inventory = character.GetComponent<InventoryManager>();
        if (inventory == null) return false;

        FlashlightItemSO lowestBatteryFlashlight = null;
        float lowestBatteryLevel = float.MaxValue;

        // Quét qua các slot trong túi đồ để tìm cái đèn pin yếu nhất
        for (int i = 0; i < inventory.items.Length; i++)
        {
            if (inventory.items[i] != null && inventory.items[i] is FlashlightItemSO flashlight)
            {
                // [FIX LỖI 49/100]: Nếu đèn mới tinh chưa bật (pin = -1) thì gán đầy pin luôn
                if (flashlight.currentBattery < 0)
                {
                    flashlight.currentBattery = flashlight.maxBattery;
                }

                // Tìm cái đèn có pin thấp nhất
                if (flashlight.currentBattery < lowestBatteryLevel)
                {
                    lowestBatteryLevel = flashlight.currentBattery;
                    lowestBatteryFlashlight = flashlight;
                }
            }
        }

        if (lowestBatteryFlashlight != null)
        {
            // [LOGIC CHẶN SẠC MÁU ĐẦY]: Đèn đã >= maxBattery thì không cho sạc
            if (lowestBatteryFlashlight.currentBattery >= lowestBatteryFlashlight.maxBattery)
            {
                Debug.Log("<color=yellow>[Battery]</color> Đèn pin đã đầy 100%, không cần sạc!");
                return false; // TRẢ VỀ FALSE -> INVENTORY SẼ TỪ CHỐI XÓA CỤC PIN NÀY
            }

            // Tiến hành sạc pin
            lowestBatteryFlashlight.currentBattery += rechargeAmount;
            if (lowestBatteryFlashlight.currentBattery > lowestBatteryFlashlight.maxBattery)
            {
                lowestBatteryFlashlight.currentBattery = lowestBatteryFlashlight.maxBattery;
            }

            Debug.Log($"<color=green>[Battery]</color> Đã dùng Pin! Hồi {rechargeAmount} điện. Đèn hiện tại: {lowestBatteryFlashlight.currentBattery}/{lowestBatteryFlashlight.maxBattery}");

            // Ép cái script PlayerFlashlight update lại log ngay lập tức (nếu đang cầm trên tay)
            var flashlightLogic = character.GetComponent<PlayerFlashlight>();
            if (flashlightLogic != null && flashlightLogic.currentMode != FlashlightMode.Off)
            {
                // Gọi Recharge với lượng 0 để ép nó trigger dòng Log xanh lá
                flashlightLogic.Recharge(0);
            }

            return true; // SẠC THÀNH CÔNG -> TRẢ VỀ TRUE ĐỂ INVENTORY TỰ ĐỘNG XÓA PIN
        }
        else
        {
            Debug.Log("<color=orange>[Battery]</color> Bạn không mang Đèn Pin nào để sạc cả!");
            return false; // KHÔNG CÓ ĐÈN -> TRẢ VỀ FALSE
        }
    }
}