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
    [HideInInspector] public float freeConsumableChance = 0f;
    [HideInInspector] public float detectionVisibilityMultiplier = 1f;
    [HideInInspector] public bool hasPropheticSight = false;
    [HideInInspector] public bool hasAutoRevive = false;
    [HideInInspector] public bool hasRelicBearer = false;
    [HideInInspector] public bool hasAncestralVow = false;

    // [Thêm mới cho Ancestral Vow]
    [HideInInspector] public float ancestralSpeedBoost = 0f;
    [HideInInspector] public float ancestralStaminaSave = 0f;

    // [Thêm mới cho Relic Bearer]
    [HideInInspector] public float postReviveSpeedBoost = 0f;
    [HideInInspector] public float postReviveBoostDuration = 0f;

    public float CurrentStamina { get; private set; }
    public bool IsExhausted { get; private set; } = false;

    private float _regenTimer = 0f;

    // Tính toán tốc độ hiện tại có cộng dồn Ancestral Vow (nếu có)
    public float CurrentMoveSpeed => (baseMoveSpeed * speedMultiplier) * (1f + ancestralSpeedBoost);
    public float CurrentSprintSpeed => (baseSprintSpeed * speedMultiplier) * (1f + ancestralSpeedBoost);
    public float MaxStamina => baseMaxStamina * maxStaminaMultiplier;

    // Hao thể lực lúc chạy (Trừ đi phần tiết kiệm của Ancestral Vow)
    public float StaminaDrainRate => (baseStaminaDrainRate * staminaDrainMultiplier) * (1f - ancestralStaminaSave);
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

    public bool CanSprint(bool isAlreadySprinting)
    {
        if (CurrentStamina <= 0 || IsExhausted) return false;

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

    // Hàm ngoài để gọi Hồi Máu (Dành cho Auto Revive)
    public void ForceSetStamina(float percent)
    {
        CurrentStamina = MaxStamina * percent;
        CurrentStamina = Mathf.Clamp(CurrentStamina, 0, MaxStamina);
        if (CurrentStamina >= MaxStamina * redZoneThresholdRatio) IsExhausted = false;
    }

    // ========================================================
    // ĐÂY LÀ HÀM CHÍ MẠNG SẾP CẦN NẠP LẠI TỪ PHOTON NETWORK
    // ========================================================
    public void ApplyPerkModifiersFromPhoton()
    {
        if (photonView == null || !photonView.IsMine) return;
        var props = photonView.Owner.CustomProperties;

        try
        {
            Debug.Log($"<color=cyan>[Stats]</color> Đang nạp {props.Count} chỉ số từ Balo Photon...");

            // 1. Nhóm Thể lực & Chạy
            if (props.TryGetValue("P_MaxStam", out object maxStamina)) maxStaminaMultiplier = Convert.ToSingle(maxStamina);
            if (props.TryGetValue("P_StamRegen", out object staminaRegen)) staminaRegenMultiplier = Convert.ToSingle(staminaRegen);
            if (props.TryGetValue("P_SprintDrain", out object sprintDrain)) staminaDrainMultiplier = Convert.ToSingle(sprintDrain);

            // 2. Nhóm Sinh tồn
            if (props.TryGetValue("P_BattDrain", out object battDrain)) batteryDrainMultiplier = Convert.ToSingle(battDrain);
            if (props.TryGetValue("P_Vis", out object vis)) detectionVisibilityMultiplier = Convert.ToSingle(vis);
            if (props.TryGetValue("P_Preserve", out object preserve)) freeConsumableChance = Convert.ToSingle(preserve);

            // 3. Nhóm Cứu hộ (Relic Bearer)
            if (props.TryGetValue("P_RevSpeed", out object revS)) reviveSpeedMultiplier = Convert.ToSingle(revS);

            if (props.TryGetValue("P_XRay", out object xRayVal)) hasPropheticSight = Convert.ToBoolean(xRayVal);
            if (props.TryGetValue("P_AutoRevive", out object autoReviveVal)) hasAutoRevive = Convert.ToBoolean(autoReviveVal);
            if (props.TryGetValue("P_RelicBearer", out object relicVal)) hasRelicBearer = Convert.ToBoolean(relicVal);
            if (props.TryGetValue("P_AncestralVow", out object vowVal)) hasAncestralVow = Convert.ToBoolean(vowVal);

            // LƯU Ý: Các chỉ số ẩn đặc biệt (như delay hồi sinh, số stack đồng đội chết, thời gian nhìn xuyên tường...)
            // Không cộng thẳng vào Base Stats mà sẽ được gọi rút trực tiếp từ Photon CustomProperties
            // lúc sếp viết Logic kích hoạt Skill (ví dụ trong GetKnocked hoặc lúc giải xong Puzzle).

            Debug.Log($"<color=green>[Stats]</color> ✅ Nạp xong! MaxStam: {maxStaminaMultiplier}, StamRegen: {staminaRegenMultiplier}, SprintDrain: {staminaDrainMultiplier}, BattDrain: {batteryDrainMultiplier}");
        }
        catch (Exception e)
        {
            Debug.LogError($"<color=red>[Stats]</color> ❌ Lỗi khi ép kiểu Perk Modifiers:\n{e.Message}");
        }
    }
}