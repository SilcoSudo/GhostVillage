using UnityEngine;
using Photon.Pun;

public enum FlashlightMode
{
    Off = 0,
    Normal = 1,
    UV = 2
}

[RequireComponent(typeof(PhotonView))]
public class PlayerFlashlight : MonoBehaviourPun
{
    [Header("State")]
    public FlashlightMode currentMode = FlashlightMode.Off;
    private FlashlightItemSO _currentEquippedFlashlight;
    private InventoryManager _inventory;

    [Header("References (Kéo thả từ Prefab)")]
    [Tooltip("Kéo cái Spotlight mà sếp tự setup ở mồm/camera vào đây")]
    public Light headLight;
    public Transform cameraTransform;
    public LayerMask monsterLayer;

    [Header("Settings")]
    private float _damageTickRate = 0.2f;
    private float _nextDamageTime = 0f;

    [Header("Visual Colors")]
    public Color normalColor = new Color(1f, 0.95f, 0.8f);
    public Color uvColor = new Color(0.5f, 0f, 1f);

    // MỚI: Biến để theo dõi log mượt mà, không xả rác console
    private float _lastLoggedBattery = -1f;

    private void Awake()
    {
        _inventory = GetComponent<InventoryManager>();
        if (cameraTransform == null) cameraTransform = GetComponentInChildren<Camera>().transform;

        // Ép tắt đèn lúc vừa vào game cho chắc cốp
        if (headLight != null) headLight.enabled = false;
        else Debug.LogError("❌ [Flashlight] Sếp quên kéo cái bóng đèn HeadLight vào Script rồi!");
    }

    private void OnEnable() { if (_inventory != null) _inventory.OnSlotChanged += HandleSlotChanged; }
    private void OnDisable() { if (_inventory != null) _inventory.OnSlotChanged -= HandleSlotChanged; }

    private void Update()
    {
        if (!photonView.IsMine || currentMode == FlashlightMode.Off || _currentEquippedFlashlight == null) return;

        // 1. TỤT PIN
        float drainMultiplier = (currentMode == FlashlightMode.UV) ? 2f : 1f;
        _currentEquippedFlashlight.currentBattery -= (_currentEquippedFlashlight.drainRate * drainMultiplier) * Time.deltaTime;

        // --- HỆ THỐNG LOG PIN (In mỗi khi tụt 5%) ---
        // Sếp có thể sửa số 5f thành 1f nếu muốn log báo chi tiết hơn
        if (_lastLoggedBattery - _currentEquippedFlashlight.currentBattery >= 5f)
        {
            _lastLoggedBattery = _currentEquippedFlashlight.currentBattery;
            int percentage = Mathf.RoundToInt((_currentEquippedFlashlight.currentBattery / _currentEquippedFlashlight.maxBattery) * 100f);

            string modeStr = currentMode == FlashlightMode.UV ? "<color=purple>[UV]</color>" : "<color=yellow>[Normal]</color>";
            Debug.Log($"{modeStr} Năng lượng đèn pin: {percentage}% ({_currentEquippedFlashlight.currentBattery:F1} / {_currentEquippedFlashlight.maxBattery})");
        }

        if (_currentEquippedFlashlight.currentBattery <= 0)
        {
            _currentEquippedFlashlight.currentBattery = 0;
            SetMode(FlashlightMode.Off);
            Debug.Log("<color=red>[Flashlight] Phụt... Đèn đã hết pin!</color>");
        }

        // 2. BẮN TIA UV DIỆT QUÁI 
        if (currentMode == FlashlightMode.UV && _currentEquippedFlashlight.currentBattery > 0 && Time.time >= _nextDamageTime)
        {
            ShootUVRay();
            _nextDamageTime = Time.time + _damageTickRate;
        }
    }

    // ==========================================
    // LOGIC 3 TRẠNG THÁI: TẮT -> THƯỜNG -> UV -> TẮT
    // ==========================================
    public void ToggleFlashlight(FlashlightItemSO data)
    {
        if (!photonView.IsMine) return;

        _currentEquippedFlashlight = data;

        if (_currentEquippedFlashlight.currentBattery < 0)
        {
            _currentEquippedFlashlight.currentBattery = _currentEquippedFlashlight.maxBattery;
            _lastLoggedBattery = _currentEquippedFlashlight.maxBattery; // Reset log counter
        }

        if (_currentEquippedFlashlight.currentBattery <= 0)
        {
            Debug.Log("<color=yellow>[Flashlight] Bấm tạch tạch... Không lên, hết pin rồi!</color>");
            SetMode(FlashlightMode.Off);
            return;
        }

        switch (currentMode)
        {
            case FlashlightMode.Off:
                _lastLoggedBattery = _currentEquippedFlashlight.currentBattery; // Đồng bộ biến đếm trước khi bật
                SetMode(FlashlightMode.Normal);
                break;
            case FlashlightMode.Normal:
                SetMode(FlashlightMode.UV);
                break;
            case FlashlightMode.UV:
                SetMode(FlashlightMode.Off);
                break;
        }
    }

    private void SetMode(FlashlightMode newMode)
    {
        currentMode = newMode;
        float range = _currentEquippedFlashlight != null ? _currentEquippedFlashlight.lightRange : 20f;

        // Bắn RPC để tất cả client cùng đổi trạng thái đèn trên đầu mình
        photonView.RPC(nameof(RpcSyncLightMode), RpcTarget.All, (int)newMode, range);
    }

    [PunRPC]
    private void RpcSyncLightMode(int modeInt, float range)
    {
        FlashlightMode mode = (FlashlightMode)modeInt;

        // SỬ DỤNG TRỰC TIẾP CÁI ĐÈN SẾP ĐÃ KÉO VÀO
        if (headLight != null)
        {
            if (mode == FlashlightMode.Off)
            {
                headLight.enabled = false;
            }
            else
            {
                headLight.enabled = true;
                headLight.range = range;

                if (mode == FlashlightMode.UV)
                {
                    headLight.color = uvColor;
                    headLight.intensity = 8f;
                }
                else // Normal
                {
                    headLight.color = normalColor;
                    headLight.intensity = 5f;
                }
            }
        }
    }

    private void HandleSlotChanged(int newSlot)
    {
        if (!photonView.IsMine) return;
        if (currentMode != FlashlightMode.Off) SetMode(FlashlightMode.Off);
        _currentEquippedFlashlight = null;
    }

    public bool CanRecharge()
    {
        return _currentEquippedFlashlight != null && _currentEquippedFlashlight.currentBattery < _currentEquippedFlashlight.maxBattery;
    }

    public void Recharge(float amount)
    {
        if (!photonView.IsMine || _currentEquippedFlashlight == null) return;

        _currentEquippedFlashlight.currentBattery += amount;
        if (_currentEquippedFlashlight.currentBattery > _currentEquippedFlashlight.maxBattery)
        {
            _currentEquippedFlashlight.currentBattery = _currentEquippedFlashlight.maxBattery;
        }

        // Reset lại biến đếm log để nó in ra ngay sau khi sạc
        _lastLoggedBattery = _currentEquippedFlashlight.currentBattery;
        Debug.Log($"<color=green>[Flashlight] Đã sạc pin! Hiện tại: {_currentEquippedFlashlight.currentBattery}/{_currentEquippedFlashlight.maxBattery}</color>");
    }

    // TRONG FILE PlayerFlashlight.cs
    private void ShootUVRay()
    {
        if (cameraTransform == null) return;

        float radius = 1.5f;
        Ray ray = new Ray(cameraTransform.position, cameraTransform.forward);

        RaycastHit[] hits = Physics.SphereCastAll(ray, radius, _currentEquippedFlashlight.lightRange, monsterLayer);

        // THÊM LOG ĐỂ BIẾT CÓ CHẠM KHÔNG
        if (hits.Length > 0)
        {
            Debug.Log($"<color=cyan>[Flashlight]</color> Tia UV trúng {hits.Length} mục tiêu thuộc Layer quái!");
        }

        foreach (var hit in hits)
        {
            // QUAN TRỌNG: Dùng GetComponentInParent để nó tự mò lên thằng cha tìm Script
            IUVReactable uvTarget = hit.collider.GetComponentInParent<IUVReactable>();

            if (uvTarget != null)
            {
                Debug.Log($"<color=green>[Flashlight]</color> Đã tìm thấy interface IUVReactable trên {hit.collider.name}! Đang đốt nó...");
                uvTarget.OnUVIrradiated(_damageTickRate, photonView.Owner.ActorNumber);
            }
            else
            {
                Debug.LogWarning($"<color=yellow>[Flashlight]</color> Tia UV trúng {hit.collider.name} nhưng nó không có interface IUVReactable!");
            }
        }
    }


}