using System;
using System.Collections.Generic;
using UnityEngine;
using Game.Core.Player.RayCast;
using Photon.Pun;
using ExitGames.Client.Photon;
using System.Linq;

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
    public ItemDataSO[] items;
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
        items = new ItemDataSO[maxSlots]; // KHỞI TẠO MẢNG
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

        // Đếm xem trong mảng có bao nhiêu đồ thật
        int actualItemCount = items.Count(i => i != null);
        if (actualItemCount == 0) return;

        Debug.Log($"<color=red>[Inventory]</color> Oạch! {photonView.Owner.NickName} rớt sạch đồ ra đất!");

        // Lặp qua mảng bằng Length
        for (int i = items.Length - 1; i >= 0; i--)
        {
            ItemDataSO itemToDrop = items[i];

            // Bỏ qua nếu ô trống hoặc là Escape Tool
            if (itemToDrop == null || itemToDrop.itemType == ItemType.EscapeTool) continue;

            if (itemToDrop.itemWorldPrefab != null)
            {
                Vector2 randomCircle = UnityEngine.Random.insideUnitCircle * 1.5f;
                Vector3 scatterPos = dropPosition.position + new Vector3(randomCircle.x, 0.5f, randomCircle.y);

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

        // Tìm khe rỗng đầu tiên
        int emptySlot = -1;
        for (int i = 0; i < maxSlots; i++)
        {
            if (items[i] == null)
            {
                emptySlot = i;
                break;
            }
        }

        if (emptySlot == -1) return false; // Túi đầy

        ItemDataSO itemToStore = newItem;
        if (newItem is FlashlightItemSO)
        {
            itemToStore = Instantiate(newItem);
            itemToStore.name = newItem.name;
        }

        items[emptySlot] = itemToStore; // Nhét vào ô trống
        Debug.Log($"[Inventory] Đã nhặt: {itemToStore.itemName} vào Slot {emptySlot + 1}");

        OnGlobalItemAdded?.Invoke(itemToStore, this);
        OnInventoryChanged?.Invoke();

        // Nếu tay đang không cầm gì, tự động chuyển sang đồ mới nhặt
        if (items[currentSlotIndex] == null)
        {
            SelectSlot(emptySlot);
        }
        else
        {
            ForceEquipCurrentItem();
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
        if (item.itemType == ItemType.EscapeTool)
        {
            Debug.LogWarning("[Inventory] Không thể vứt vật phẩm thoát hiểm!");
            return false;
        }

        bool found = false;
        for (int i = 0; i < maxSlots; i++)
        {
            if (items[i] == item)
            {
                items[i] = null; // Làm rỗng ô đó
                found = true;
                break;
            }
        }

        if (!found) return false;

        Debug.Log($"<color=orange>[Inventory] Vừa xóa {item.itemName}. Slot giữ nguyên: {currentSlotIndex + 1}</color>");

        OnInventoryChanged?.Invoke();
        ForceEquipCurrentItem(); // Cập nhật lại tay (nếu đang cầm ô vừa bị xóa thì tay sẽ tự buông thõng xuống)

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
        // Fix Count thành Length
        if (slotIndex < 0 || slotIndex >= items.Length || items[slotIndex] == null) return;

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
        if (currentSlotIndex >= items.Length || items[currentSlotIndex] == null) return;

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

        Debug.Log($"<color=yellow>[Inventory] Yêu cầu chuyển sang Slot: {index + 1} (Đang ở {currentSlotIndex + 1})</color>");

        // Vẫn check để tối ưu, nhưng ta xài biến cờ
        bool needToUpdate = (currentSlotIndex != index);

        currentSlotIndex = index;

        if (needToUpdate)
        {
            OnSlotChanged?.Invoke(currentSlotIndex);
        }

        // BẮT BUỘC gọi để đồng bộ tay, dù có bấm trùng nút số 1 đi nữa
        ForceEquipCurrentItem();
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
        Array.Clear(items, 0, items.Length);
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
    /// <summary>
    /// Gắn/Tháo model item trên tay nhân vật (Visual).
    /// </summary>
    private void ForceEquipCurrentItem()
    {
        if (_playerInteract == null) return;

        if (currentSlotIndex < maxSlots && items[currentSlotIndex] != null) // CÓ CHECK NULL
        {
            ItemDataSO item = items[currentSlotIndex];
            if (item.itemHandModel != null)
            {
                Debug.Log($"<color=cyan>[Inventory] Đang cầm món: {item.itemName} (Tay: {item.holdType})</color>");
                _playerInteract.AttachHeldItem(item.itemHandModel, item.holdType);
                if (_animator != null) _animator.SetInteger(_itemTypeHash, (int)item.holdType);
            }
            else
            {
                _playerInteract.DetachHeldItem();
                if (_animator != null) _animator.SetInteger(_itemTypeHash, 0);
            }
        }
        else
        {
            Debug.Log("<color=cyan>[Inventory] Tay Không (Slot rỗng)</color>");
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
        // Đổi qua dùng vòng for cho an toàn với mảng cố định
        for (int i = 0; i < items.Length; i++)
        {
            // BẮT BUỘC PHẢI CHECK NULL TRƯỚC KHI ĐỌC ITEM TYPE
            if (items[i] != null && items[i].itemType == ItemType.KeyItem)
            {
                count++;
            }
        }

        ExitGames.Client.Photon.Hashtable props = new ExitGames.Client.Photon.Hashtable();
        props["KeyCount"] = count;
        PhotonNetwork.LocalPlayer.SetCustomProperties(props);

        Debug.Log($"[Inventory] Đã báo cáo lên Server: Tôi đang giữ {count} KeyItem.");
    }

    #endregion
}