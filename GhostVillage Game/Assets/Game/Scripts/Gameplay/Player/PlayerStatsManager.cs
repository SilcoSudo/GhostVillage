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

    // Tính toán tốc độ hiện tại có cộng dồn Ancestral Vow và Relic Bearer Buff
    public float CurrentMoveSpeed => (baseMoveSpeed * speedMultiplier) * (1f + ancestralSpeedBoost + postReviveSpeedBoost);
    public float CurrentSprintSpeed => (baseSprintSpeed * speedMultiplier) * (1f + ancestralSpeedBoost + postReviveSpeedBoost);
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

            CurrentStamina = MaxStamina;

            // ==========================================
            // LOG TOÀN BỘ CHỈ SỐ GỐC & SAU KHI CỘNG PERK
            // ==========================================
            string logMsg = "<color=green>✅ [Stats] BÁO CÁO CHỈ SỐ NGƯỜI CHƠI SAU KHI MẶC PERK:</color>\n";

            logMsg += $"🏃 Tốc độ đi bộ: {baseMoveSpeed} -> <b>{CurrentMoveSpeed}</b>\n";
            logMsg += $"🏃 Tốc độ chạy: {baseSprintSpeed} -> <b>{CurrentSprintSpeed}</b>\n";
            logMsg += $"🫁 Thể lực Tối đa: {baseMaxStamina} -> <b>{MaxStamina}</b>\n";
            logMsg += $"🫁 Hồi Thể lực: {baseStaminaRegenRate}/s -> <b>{StaminaRegenRate}/s</b>\n";
            logMsg += $"🫁 Hao Thể lực (Chạy): {baseStaminaDrainRate}/s -> <b>{StaminaDrainRate}/s</b>\n";
            logMsg += $"🔋 Hao Pin: Cơ bản x <b>{batteryDrainMultiplier}</b>\n";
            logMsg += $"🚑 Tốc độ Cứu người: {baseReviveSpeed} -> <b>{ReviveSpeed}</b>\n";
            logMsg += $"🎒 Tỉ lệ giữ lại vật phẩm (Túi vải chàm): <b>{freeConsumableChance * 100}%</b>\n";
            logMsg += $"👁️ Tầm nhìn bị quái phát hiện: Cơ bản x <b>{detectionVisibilityMultiplier}</b>\n";

            logMsg += "\n<color=orange>🔥 CÁC KỸ NĂNG ĐẶC BIỆT KÍCH HOẠT:</color>\n";
            if (hasPropheticSight) logMsg += "- Prophetic Sight (Nhìn xuyên tường)\n";
            if (hasAutoRevive) logMsg += "- Spectral Reflection (Tự hồi sinh)\n";
            if (hasRelicBearer) logMsg += "- Relic Bearer (Chạy nhanh sau khi cứu)\n";
            if (hasAncestralVow) logMsg += "- Ancestral Vow (Nhận buff khi đồng đội chết)\n";

            if (!hasPropheticSight && !hasAutoRevive && !hasRelicBearer && !hasAncestralVow)
                logMsg += "- Không có kỹ năng đặc biệt nào.\n";

            Debug.Log(logMsg);

        }
        catch (Exception e)
        {
            Debug.LogError($"<color=red>[Stats]</color> ❌ Lỗi khi ép kiểu Perk Modifiers:\n{e.Message}");
        }
    }

    // ========================================================
    // PERK LOGIC: LẮNG NGHE SỰ KIỆN QUY MÔ TOÀN BẢN ĐỒ
    // ========================================================
    private int _ancestralStacks = 0;
    private Coroutine _relicBuffCoroutine;

    public void OnEnable()
    {
        Game.Scripts.Gameplay.Core.GameplayEvents.OnPlayerStatusChanged += HandlePlayerStatusChanged;
    }

    public void OnDisable()
    {
        Game.Scripts.Gameplay.Core.GameplayEvents.OnPlayerStatusChanged -= HandlePlayerStatusChanged;
    }

    // --- XỬ LÝ ANCESTRAL VOW ---
    private void HandlePlayerStatusChanged(int actorNum, PlayerMatchStatus status)
    {
        if (photonView == null || !photonView.IsMine || !hasAncestralVow) return;

        // Nếu một đồng đội (không phải mình) vừa bị loại (Eliminated)
        if (status == PlayerMatchStatus.Eliminated && actorNum != photonView.OwnerActorNr)
        {
            if (_ancestralStacks < 3) // Tối đa 3 stack
            {
                _ancestralStacks++;
                ancestralSpeedBoost = _ancestralStacks * 0.05f;  // +5% Speed mỗi mạng
                ancestralStaminaSave = _ancestralStacks * 0.10f; // -10% Hao thể lực mỗi mạng
                Debug.Log($"<color=orange>[Perk] Lời Thề Tổ Tiên kích hoạt! Đồng đội ngã xuống. Stack: {_ancestralStacks}/3</color>");
            }
        }
    }

    // --- XỬ LÝ RELIC BEARER ---
    // Hàm này dành cho Người Cứu tự gọi trên máy mình
    public void TriggerRelicBearerBuff()
    {
        if (!photonView.IsMine) return;
        if (_relicBuffCoroutine != null) StopCoroutine(_relicBuffCoroutine);
        _relicBuffCoroutine = StartCoroutine(RelicBuffRoutine());
    }

    // Hàm này dành cho Nạn Nhân nhận RPC từ Người Cứu
    [PunRPC]
    public void RpcReceiveRelicBearerBuff()
    {
        if (!photonView.IsMine) return; // Đảm bảo máy ai nấy cộng chỉ số
        if (_relicBuffCoroutine != null) StopCoroutine(_relicBuffCoroutine);
        _relicBuffCoroutine = StartCoroutine(RelicBuffRoutine());
    }

    private System.Collections.IEnumerator RelicBuffRoutine()
    {
        postReviveSpeedBoost = 0.15f; // Buff 15% tốc độ
        Debug.Log("<color=cyan>[Buff] Đôi chân thanh thoát! Nhận 15% tốc độ chạy trong 5 giây!</color>");

        yield return new WaitForSeconds(5f); // Đợi 5 giây

        postReviveSpeedBoost = 0f;    // Tắt Buff
        Debug.Log("<color=cyan>[Buff] Hết thời gian buff tốc độ.</color>");
    }
}