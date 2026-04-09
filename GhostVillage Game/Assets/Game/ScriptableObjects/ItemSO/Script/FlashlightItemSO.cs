using UnityEngine;

[CreateAssetMenu(fileName = "NewFlashlight", menuName = "Game Data/Items/Flashlight")]
public class FlashlightItemSO : ItemDataSO
{
    [Header("Flashlight Stats")]
    public float maxBattery = 100f;
    public float drainRate = 1.5f;
    public float lightRange = 20f;
    public float uvDamagePerSecond = 10f;

    // MỚI: Biến này sẽ lưu pin thực tế của từng cái đèn!
    [Header("Dynamic Data (Không điền)")]
    public float currentBattery = -1f; // -1 nghĩa là đèn mới tinh chưa xài

    private void OnEnable()
    {
        itemType = ItemType.Equipment;
        holdType = HoldType.OneHand;
    }

    public override bool OnUse(GameObject character)
    {
        var flashlightController = character.GetComponentInChildren<PlayerFlashlight>();
        if (flashlightController != null)
        {
            flashlightController.ToggleFlashlight(this);
        }
        return false;
    }
}