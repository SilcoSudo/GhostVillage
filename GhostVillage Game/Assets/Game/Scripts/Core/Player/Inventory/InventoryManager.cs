using System;
using System.Collections.Generic;
using UnityEngine;
using Game.Core.Player.RayCast;
using Photon.Pun;
using ExitGames.Client.Photon;

/// <summary>
/// Quản lý túi đồ của người chơi, bao gồm logic nhặt, dùng, vứt item và đồng bộ mạng.
/// </summary>
public class InventoryManager : MonoBehaviourPun
{
    #region Settings & Data
    [Header("Settings")]
    public int maxSlots = 3;
    public Transform dropPosition;
    public float dropForce = 3f;

    [Header("Data")]
    public List<ItemDataSO> items = new List<ItemDataSO>();
    public int currentSlotIndex = 0;

    // Biến nội bộ trạng thái
    private bool _isInventoryLocked = false;
    private PlayerInteract _playerInteract;

    private Animator _animator;
    private int _itemTypeHash;

    public static InventoryManager LocalInstance { get; private set; }
    #endregion

    #region Events
    /// <summary>
    /// Bắn ra khi bất kỳ ai nhặt được đồ (Dùng cho Objective check)
    /// </summary>
    public static event Action<ItemDataSO, InventoryManager> OnGlobalItemAdded;

    /// <summary>
    /// Bắn ra khi túi đồ thay đổi (Thêm/Xóa) -> UI cập nhật
    /// </summary>
    public event Action OnInventoryChanged;

    /// <summary>
    /// Bắn ra khi chuyển slot cầm tay
    /// </summary>
    public event Action<int> OnSlotChanged;
    #endregion

    #region Unity Lifecycle
    private void Awake()
    {
        _playerInteract = GetComponent<PlayerInteract>();
        _animator = GetComponentInChildren<Animator>();
        _itemTypeHash = Animator.StringToHash("ItemType");
    }

    private void Start()
    {
        if (photonView.IsMine)
        {
            LocalInstance = this;
            SelectSlot(0);
        }
    }

    private void OnDestroy()
    {
        // Hủy đăng ký khi object bị hủy
        if (photonView.IsMine && LocalInstance == this)
        {
            LocalInstance = null;
        }
    }
    #endregion

    #region Public Inventory API

    /// <summary>
    /// Bắn toàn bộ đồ trong túi ra xung quanh (Dùng khi bị Gục hoặc Chết)
    /// </summary>
    public void DropAllItemsScattered()
    {
        if (!photonView.IsMine) return;
        if (items.Count == 0) return;

        Debug.Log($"<color=red>[Inventory]</color> Oạch! {photonView.Owner.NickName} rớt sạch đồ ra đất!");

        for (int i = items.Count - 1; i >= 0; i--)
        {
            ItemDataSO itemToDrop = items[i];

            if (itemToDrop.itemType == ItemType.EscapeTool) continue;

            if (itemToDrop.itemWorldPrefab != null)
            {
                Vector2 randomCircle = UnityEngine.Random.insideUnitCircle * 1.5f;
                Vector3 scatterPos = dropPosition.position + new Vector3(randomCircle.x, 0.5f, randomCircle.y);

                // Lấy lượng pin hiện tại truyền qua mạng
                float savedBattery = -1f;
                if (itemToDrop is FlashlightItemSO flashlight) savedBattery = flashlight.currentBattery;
                object[] customInitData = new object[1] { savedBattery };

                GameObject droppedItem = PhotonNetwork.Instantiate(
                    itemToDrop.itemWorldPrefab.name,
                    scatterPos,
                    UnityEngine.Random.rotation,
                    0,
                    customInitData
                );

                Rigidbody rb = droppedItem.GetComponent<Rigidbody>();
                if (rb != null)
                {
                    Vector3 popForce = (Vector3.up * 3f) + (new Vector3(randomCircle.x, 0, randomCircle.y).normalized * 2f);
                    rb.AddForce(popForce, ForceMode.Impulse);
                }
            }
        }

        ClearInventoryAndLock();
    }

    /// <summary>
    /// Thêm vật phẩm vào túi. Trả về true nếu thành công.
    /// </summary>
    public bool AddItem(ItemDataSO newItem)
    {
        if (_isInventoryLocked && newItem.itemType != ItemType.EscapeTool)
        {
            Debug.LogWarning("[Inventory] Túi đã bị khóa! Chỉ được nhặt Escape Tool.");
            return false;
        }

        if (items.Count >= maxSlots) return false;

        // [TỐI ƯU DỌN RÁC]: Mặc định xài luôn hàng gốc (Dành cho Medkit, Pin, Còi...)
        ItemDataSO itemToStore = newItem;

        // NẾU LÀ ĐÈN PIN: Bắt buộc đẻ bản sao để lưu lượng Pin riêng biệt
        if (newItem is FlashlightItemSO)
        {
            itemToStore = Instantiate(newItem);
            itemToStore.name = newItem.name; // Xóa chữ (Clone)
        }

        items.Add(itemToStore);
        Debug.Log($"[Inventory] Đã nhặt: {itemToStore.itemName}");

        OnGlobalItemAdded?.Invoke(itemToStore, this);
        OnInventoryChanged?.Invoke();

        if (items.Count - 1 == currentSlotIndex || items.Count == 1)
        {
            currentSlotIndex = items.Count - 1;
            EquipCurrentItem();
        }

        if (itemToStore.itemType == ItemType.KeyItem)
        {
            SyncKeyCountToNetwork();
        }

        return true;
    }

    /// <summary>
    /// Xóa vật phẩm khỏi túi. Trả về true nếu thành công.
    /// </summary>
    public bool RemoveItem(ItemDataSO item)
    {
        // Không cho phép vứt Escape Tool
        if (item.itemType == ItemType.EscapeTool)
        {
            Debug.LogWarning("Không thể vứt vật phẩm thoát hiểm!");
            return false;
        }

        if (!items.Contains(item)) return false;

        items.Remove(item);
        OnInventoryChanged?.Invoke();
        EquipCurrentItem();

        // Sync lại nếu vừa mất KeyItem
        if (item.itemType == ItemType.KeyItem)
        {
            SyncKeyCountToNetwork();
        }

        return true;
    }

    /// <summary>
    /// Sử dụng item tại slot chỉ định.
    /// </summary>
    public void UseItem(int slotIndex)
    {
        if (slotIndex < 0 || slotIndex >= items.Count) return;

        ItemDataSO itemToUse = items[slotIndex];
        bool consumed = itemToUse.OnUse(this.gameObject);

        if (consumed)
        {
            RemoveItem(itemToUse);
        }
    }

    /// <summary>
    /// Sử dụng item đang cầm trên tay.
    /// </summary>
    public void UseCurrentItem()
    {
        UseItem(currentSlotIndex);
    }

    /// <summary>
    /// Vứt item đang cầm ra đất (Spawn Prefab).
    /// </summary>
    public void DropCurrentItem()
    {
        if (currentSlotIndex >= items.Count) return;

        ItemDataSO itemToDrop = items[currentSlotIndex];

        if (itemToDrop.itemType == ItemType.EscapeTool)
        {
            Debug.LogWarning("Không thể vứt vật phẩm thoát hiểm!");
            return;
        }

        if (itemToDrop.itemWorldPrefab != null)
        {
            string prefabName = itemToDrop.itemWorldPrefab.name;
            var resourceCheck = Resources.Load(prefabName);

            if (resourceCheck == null)
            {
                Debug.LogError($" LỖI: Không tìm thấy Prefab '{prefabName}' trong Resources!");
                return;
            }

            // Lấy lượng pin hiện tại (nếu là đèn pin)
            float savedBattery = -1f;
            if (itemToDrop is FlashlightItemSO flashlight) savedBattery = flashlight.currentBattery;

            // Truyền lượng pin qua mạng cho cái Model rớt dưới đất
            object[] customInitData = new object[1] { savedBattery };

            GameObject droppedItem = PhotonNetwork.Instantiate(
                prefabName,
                dropPosition.position,
                dropPosition.rotation,
                0, // group
                customInitData // <-- Bí kíp truyền hồn nằm ở đây
            );

            Rigidbody rb = droppedItem.GetComponent<Rigidbody>();
            if (rb != null) rb.AddForce(dropPosition.forward * dropForce, ForceMode.Impulse);

            RemoveItem(itemToDrop);
        }
    }

    #endregion

    #region Slot Control

    public void SelectSlot(int index)
    {
        if (index < 0 || index >= maxSlots) return;
        if (currentSlotIndex == index) return;

        currentSlotIndex = index;
        OnSlotChanged?.Invoke(currentSlotIndex);
        EquipCurrentItem();
    }

    public void ScrollSlot(float direction)
    {
        if (direction > 0)
            SelectSlot((currentSlotIndex + 1) % maxSlots);
        else if (direction < 0)
            SelectSlot((currentSlotIndex - 1 + maxSlots) % maxSlots);
    }

    #endregion

    #region Helper & Queries

    /// <summary>
    /// Đếm số lượng item cụ thể trong túi theo ID.
    /// </summary>
    public int CountItem(string targetItemId)
    {
        int count = 0;
        foreach (var item in items)
        {
            if (item != null && item.itemId == targetItemId)
            {
                count++;
            }
        }
        return count;
    }

    public bool HasItem(ItemDataSO item) => items.Contains(item);

    #endregion

    #region Escape Logic (Endgame)

    /// <summary>
    /// Xóa sạch túi đồ và khóa không cho nhặt thêm (trừ EscapeTool).
    /// </summary>
    public void ClearInventoryAndLock()
    {
        items.Clear();
        _isInventoryLocked = true;

        if (_playerInteract != null) _playerInteract.DetachHeldItem();

        OnInventoryChanged?.Invoke();
        Debug.Log("[Inventory] Đã xóa sạch túi đồ!");

        // Reset key count về 0
        SyncKeyCountToNetwork();
    }

    public void LockInventory(bool isLocked)
    {
        _isInventoryLocked = isLocked;
        Debug.Log($"[Inventory] Trạng thái khóa túi: {isLocked}");
    }

    #endregion

    #region Private Helpers

    /// <summary>
    /// Gắn/Tháo model item trên tay nhân vật (Visual).
    /// </summary>
    private void EquipCurrentItem()
    {
        if (_playerInteract == null) return;

        if (currentSlotIndex < items.Count)
        {
            ItemDataSO item = items[currentSlotIndex];
            if (item.itemHandModel != null)
            {
                // 1. Spawn model đồ vật vào đúng tay
                _playerInteract.AttachHeldItem(item.itemHandModel, item.holdType);

                // 2. Kích hoạt Animation nhấc tay lên
                if (_animator != null) _animator.SetInteger(_itemTypeHash, (int)item.holdType);
            }
            else
            {
                // Có item nhưng không có model -> hạ tay
                _playerInteract.DetachHeldItem();
                if (_animator != null) _animator.SetInteger(_itemTypeHash, 0);
            }
        }
        else
        {
            // Tay không -> hạ tay
            _playerInteract.DetachHeldItem();
            if (_animator != null) _animator.SetInteger(_itemTypeHash, 0);
        }
    }

    /// <summary>
    /// Đồng bộ số lượng KeyItem hiện có lên Photon Custom Properties.
    /// </summary>
    private void SyncKeyCountToNetwork()
    {
        if (!photonView.IsMine) return;

        int count = 0;
        foreach (var i in items)
        {
            if (i.itemType == ItemType.KeyItem) count++;
        }

        Hashtable props = new Hashtable();
        props["KeyCount"] = count;
        PhotonNetwork.LocalPlayer.SetCustomProperties(props);

        Debug.Log($"[Inventory] Đã báo cáo lên Server: Tôi đang giữ {count} KeyItem.");
    }

    #endregion
}