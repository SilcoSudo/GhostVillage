using UnityEngine;
using Photon.Pun;

public class PlayerStatsManager : MonoBehaviourPun
{
    [Header("⚙️ Settings (Từ Menu UI)")]
    public float lookSensitivity = 2f;

    [Header("🏃 Base Movement Stats")]
    [SerializeField] private float baseMoveSpeed = 4f;
    [SerializeField] private float baseSprintSpeed = 6f;

    [Header("🫁 Base Stamina Stats")]
    [SerializeField] private float baseMaxStamina = 100f;
    [SerializeField] private float baseStaminaDrainRate = 15f;
    [SerializeField] private float baseStaminaRegenRate = 10f;

    [Header("🛠️ Base Survival & Item Stats")]
    [SerializeField] private float baseBatteryDrainRate = 1f;
    [SerializeField] private float baseReviveSpeed = 1f; // Tốc độ cứu bồ gốc (tính theo số giây hoặc multiplier tùy bro)

    // ==========================================
    // 🟢 PERK MULTIPLIERS / MODIFIERS (Mặc định là 1.0 hoặc 0)
    // ==========================================

    // Tốc độ di chuyển (Chịu ảnh hưởng bởi: Khấn Cầu Tổ Tiên, Người Toàn Xá Lợi buff)
    [HideInInspector] public float speedMultiplier = 1f;

    // Thể lực (Chịu ảnh hưởng bởi: Thắt Lưng Cỏ Bện, Đôi Dép Lốp, Khấn Cầu Tổ Tiên)
    [HideInInspector] public float maxStaminaMultiplier = 1f;
    [HideInInspector] public float staminaDrainMultiplier = 1f;
    [HideInInspector] public float staminaRegenMultiplier = 1f;

    // Item & Survival (Chịu ảnh hưởng bởi: Dạ Nhãn, Người Toàn Xá Lợi, Túi Vải Chàm, Chuỗi Hạt Trầm)
    [HideInInspector] public float batteryDrainMultiplier = 1f;
    [HideInInspector] public float reviveSpeedMultiplier = 1f;
    [HideInInspector] public float medkitEffectivenessMultiplier = 1f; // Tăng máu hồi hoặc xài nhanh hơn
    [HideInInspector] public float freeConsumableChance = 0f; // Tỉ lệ % không mất đồ (Túi Vải Chàm)
    [HideInInspector] public float detectionVisibilityMultiplier = 1f; // Hệ số quái nhìn thấy (Chuỗi Hạt Trầm)

    // ==========================================
    // 🔵 CURRENT STATS (Hàm Getter cho các Script khác gọi)
    // ==========================================
    public float CurrentMoveSpeed => baseMoveSpeed * speedMultiplier;
    public float CurrentSprintSpeed => baseSprintSpeed * speedMultiplier;

    public float MaxStamina => baseMaxStamina * maxStaminaMultiplier;
    public float StaminaDrainRate => baseStaminaDrainRate * staminaDrainMultiplier;
    public float StaminaRegenRate => baseStaminaRegenRate * staminaRegenMultiplier;

    public float BatteryDrainRate => baseBatteryDrainRate * batteryDrainMultiplier;
    public float ReviveSpeed => baseReviveSpeed * reviveSpeedMultiplier;

    // Cập nhật Sensitivity từ Settings
    public void SetLookSensitivity(float newSensitivity)
    {
        lookSensitivity = newSensitivity;
    }
}