using UnityEngine;
using Photon.Pun;
using System;

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
    [SerializeField] private float baseReviveSpeed = 1f;

    // ==========================================
    // 🟢 PERK MULTIPLIERS / MODIFIERS
    // ==========================================
    [HideInInspector] public float speedMultiplier = 1f;
    [HideInInspector] public float maxStaminaMultiplier = 1f;
    [HideInInspector] public float staminaDrainMultiplier = 1f;
    [HideInInspector] public float staminaRegenMultiplier = 1f;
    [HideInInspector] public float batteryDrainMultiplier = 1f;
    [HideInInspector] public float reviveSpeedMultiplier = 1f;
    [HideInInspector] public float medkitEffectivenessMultiplier = 1f;
    [HideInInspector] public float freeConsumableChance = 0f;
    [HideInInspector] public float detectionVisibilityMultiplier = 1f;

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

    public void SetLookSensitivity(float newSensitivity)
    {
        lookSensitivity = newSensitivity;
    }

    // ==========================================
    // BƠM CHỈ SỐ TỪ PHOTON KHI VÀO GAME VÀ IN LOG CHI TIẾT
    // ==========================================
    public void ApplyPerkModifiersFromPhoton()
    {
        if (photonView == null || !photonView.IsMine) return;

        var props = photonView.Owner.CustomProperties;

        // FIX ÉP KIỂU: Dùng Convert.ToSingle để chống lỗi Photon chuyển Float thành Int
        if (props.TryGetValue("Perk_MaxStamina", out object maxStamina))
            maxStaminaMultiplier = Convert.ToSingle(maxStamina);

        if (props.TryGetValue("Perk_StaminaRegen", out object staminaRegen))
            staminaRegenMultiplier = Convert.ToSingle(staminaRegen);

        if (props.TryGetValue("Perk_ReviveSpeed", out object reviveSpeed))
            reviveSpeedMultiplier = Convert.ToSingle(reviveSpeed);

        if (props.TryGetValue("Perk_PreserveItem", out object preserveItem))
            freeConsumableChance = Convert.ToSingle(preserveItem);

        // --- IN LOG BÁO CÁO TỔNG KẾT CHỈ SỐ ---
        Debug.Log("<color=cyan>=========================================</color>");
        Debug.Log($"<color=yellow>[PlayerStats] BÁO CÁO CHỈ SỐ NHÂN VẬT CỦA SẾP (ĐÃ ÉP KIỂU AN TOÀN)</color>");
        Debug.Log($"🏃 Tốc độ đi bộ : {baseMoveSpeed} x {speedMultiplier} = <color=green>{CurrentMoveSpeed}</color>");
        Debug.Log($"🏃 Tốc độ chạy  : {baseSprintSpeed} x {speedMultiplier} = <color=green>{CurrentSprintSpeed}</color>");
        Debug.Log($"🫁 Thể lực Max   : {baseMaxStamina} x {maxStaminaMultiplier} = <color=green>{MaxStamina}</color>");
        Debug.Log($"🫁 Hồi Thể lực   : {baseStaminaRegenRate} x {staminaRegenMultiplier} = <color=green>{StaminaRegenRate}</color>");
        Debug.Log($"🫁 Tốc độ tụt TL : {baseStaminaDrainRate} x {staminaDrainMultiplier} = <color=red>{StaminaDrainRate}</color>");
        Debug.Log($"🛠️ Tốc độ Cứu bồ : {baseReviveSpeed} x {reviveSpeedMultiplier} = <color=green>{ReviveSpeed}</color>");
        Debug.Log($"🎒 Tỉ lệ giữ đồ  : <color=green>{freeConsumableChance * 100}%</color>");
        Debug.Log("<color=cyan>=========================================</color>");
    }
}