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

    // Ngưỡng Đỏ (Tính theo %) - 0.2 tức là 20%
    [SerializeField] private float redZoneThresholdRatio = 0.2f;
    [SerializeField] private float staminaRegenDelay = 1f;

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

    public float CurrentStamina { get; private set; }
    public bool IsExhausted { get; private set; } = false;

    private float _regenTimer = 0f;

    public float CurrentMoveSpeed => baseMoveSpeed * speedMultiplier;
    public float CurrentSprintSpeed => baseSprintSpeed * speedMultiplier;
    public float MaxStamina => baseMaxStamina * maxStaminaMultiplier;
    public float StaminaDrainRate => baseStaminaDrainRate * staminaDrainMultiplier;
    public float StaminaRegenRate => baseStaminaRegenRate * staminaRegenMultiplier;
    public float BatteryDrainRate => baseBatteryDrainRate * batteryDrainMultiplier;
    public float ReviveSpeed => baseReviveSpeed * reviveSpeedMultiplier;

    public float StaminaNormalized => CurrentStamina / MaxStamina;
    public float RedZoneThreshold => redZoneThresholdRatio;

    private void Start()
    {
        CurrentStamina = MaxStamina;
    }

    private void Update()
    {
        if (photonView != null && !photonView.IsMine) return;

        if (_regenTimer > 0)
        {
            _regenTimer -= Time.deltaTime;
        }
        else if (CurrentStamina < MaxStamina)
        {
            CurrentStamina += StaminaRegenRate * Time.deltaTime;
            CurrentStamina = Mathf.Clamp(CurrentStamina, 0, MaxStamina);
        }

        // [FIX CHÍ MẠNG]: Kiểm tra và chốt cờ Exhausted tự động mỗi frame
        if (CurrentStamina >= MaxStamina * redZoneThresholdRatio)
        {
            IsExhausted = false; // Lên lại vạch xanh -> Hết mệt
        }
        else if (CurrentStamina <= 0)
        {
            IsExhausted = true;  // Về 0 -> Chắc chắn mệt
        }
    }

    public void SetLookSensitivity(float newSensitivity)
    {
        lookSensitivity = newSensitivity;
    }

    // [FIX CHÍ MẠNG]: Thêm tham số isAlreadySprinting để phân biệt đè Shift hay mới bấm
    public bool CanSprint(bool isAlreadySprinting)
    {
        // 1. Hết sạch máu HOẶC đang bị mệt -> CẤM CHẠY
        if (CurrentStamina <= 0 || IsExhausted) return false;

        // 2. Mới bắt đầu bấm Shift mà máu đang ở vạch Đỏ -> CẤM CHẠY
        if (!isAlreadySprinting && CurrentStamina < MaxStamina * redZoneThresholdRatio)
        {
            return false;
        }

        return true;
    }

    public void DrainStaminaForSprint()
    {
        if (CurrentStamina > 0)
        {
            CurrentStamina -= StaminaDrainRate * Time.deltaTime;
            CurrentStamina = Mathf.Clamp(CurrentStamina, 0, MaxStamina);
            _regenTimer = staminaRegenDelay;
        }
    }

    public void StopSprinting()
    {
        if (CurrentStamina < MaxStamina * redZoneThresholdRatio)
        {
            IsExhausted = true;
        }
    }

    public void ApplyPerkModifiersFromPhoton()
    {
        if (photonView == null || !photonView.IsMine) return;
        var props = photonView.Owner.CustomProperties;

        if (props.TryGetValue("Perk_MaxStamina", out object maxStamina)) maxStaminaMultiplier = Convert.ToSingle(maxStamina);
        if (props.TryGetValue("Perk_StaminaRegen", out object staminaRegen)) staminaRegenMultiplier = Convert.ToSingle(staminaRegen);
        if (props.TryGetValue("Perk_ReviveSpeed", out object reviveSpeed)) reviveSpeedMultiplier = Convert.ToSingle(reviveSpeed);
        if (props.TryGetValue("Perk_PreserveItem", out object preserveItem)) freeConsumableChance = Convert.ToSingle(preserveItem);
    }
}