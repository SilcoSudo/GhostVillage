using UnityEngine;
using Photon.Pun;

[RequireComponent(typeof(PhotonView))]
public class PlayerFlashlight : MonoBehaviourPun
{
    public bool isLightOn = false;
    private FlashlightItemSO _currentEquippedFlashlight; // MỚI: Trỏ tới cái đèn đang cầm
    private InventoryManager _inventory;

    private void Awake() => _inventory = GetComponent<InventoryManager>();
    private void OnEnable() { if (_inventory != null) _inventory.OnSlotChanged += HandleSlotChanged; }
    private void OnDisable() { if (_inventory != null) _inventory.OnSlotChanged -= HandleSlotChanged; }

    private void Update()
    {
        if (!photonView.IsMine || !isLightOn || _currentEquippedFlashlight == null) return;

        // Tụt pin GHI THẲNG VÀO TÚI ĐỒ
        _currentEquippedFlashlight.currentBattery -= _currentEquippedFlashlight.drainRate * Time.deltaTime;

        if (_currentEquippedFlashlight.currentBattery <= 0)
        {
            _currentEquippedFlashlight.currentBattery = 0;
            TurnOffLight();
            Debug.Log("<color=red>[Flashlight] Hết pin rồi!</color>");
        }

        // Chỗ này sếp chèn hàm bắn tia UV sếp tự viết vào nhe
    }

    public void ToggleFlashlight(FlashlightItemSO data)
    {
        if (!photonView.IsMine) return;

        // Cập nhật cái đèn đang cầm
        _currentEquippedFlashlight = data;

        // Nếu đèn mới tinh từ DB rớt xuống (-1), bơm đầy pin cho nó
        if (_currentEquippedFlashlight.currentBattery < 0)
            _currentEquippedFlashlight.currentBattery = _currentEquippedFlashlight.maxBattery;

        if (isLightOn)
        {
            TurnOffLight();
        }
        else if (_currentEquippedFlashlight.currentBattery > 0)
        {
            TurnOnLight(_currentEquippedFlashlight.lightRange);
        }
    }

    private void TurnOnLight(float range)
    {
        isLightOn = true;
        photonView.RPC(nameof(RpcSyncLight), RpcTarget.All, true, range);
    }

    private void TurnOffLight()
    {
        isLightOn = false;
        photonView.RPC(nameof(RpcSyncLight), RpcTarget.All, false, 0f);
    }

    [PunRPC]
    private void RpcSyncLight(bool state, float range)
    {
        Light handLight = GetComponentInChildren<Light>(true);
        if (handLight != null)
        {
            handLight.enabled = state;
            if (state) handLight.range = range;
        }
    }

    private void HandleSlotChanged(int newSlot)
    {
        if (!photonView.IsMine) return;
        if (isLightOn) TurnOffLight(); // Đổi đồ là phụt tắt
        _currentEquippedFlashlight = null; // Xóa kết nối
    }
}