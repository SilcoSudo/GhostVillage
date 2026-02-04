using System;
using System.Collections.Generic;
using UnityEngine;
using Game.Core.Player.RayCast;
using Photon.Pun;

// Xóa: using UnityEngine.InputSystem; (Không cần nữa vì không xử lý input ở đây)

public class InventoryManager : MonoBehaviourPun
{
    [Header("Settings")]
    public int maxSlots = 3;
    public Transform dropPosition; // Kéo vị trí Drop (trước mặt Camera) vào đây
    public float dropForce = 3f;

    [Header("Data")]
    public List<ItemDataSO> items = new List<ItemDataSO>();
    public int currentSlotIndex = 0;

    // Events
    public static event Action<ItemDataSO, InventoryManager> OnGlobalItemAdded;
    public event Action OnInventoryChanged;
    public event Action<int> OnSlotChanged;

    private PlayerInteract _playerInteract;

    private void Awake()
    {
        _playerInteract = GetComponent<PlayerInteract>();
    }

    private void Start()
    {
        if (photonView.IsMine)
        {
            SelectSlot(0);
        }
    }

    // --- CÁC HÀM PUBLIC (Được gọi từ FPSController) ---

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

    public void DropCurrentItem()
    {
        if (currentSlotIndex >= items.Count) return;

        ItemDataSO itemToDrop = items[currentSlotIndex];

        if (itemToDrop.itemWorldPrefab != null)
        {
            // Kiểm tra xem có load được không trước khi spawn
            string prefabName = itemToDrop.itemWorldPrefab.name;
            var resourceCheck = Resources.Load(prefabName);

            if (resourceCheck == null)
            {
                Debug.LogError($"❌ LỖI: Không tìm thấy Prefab '{prefabName}' trong thư mục Resources! Hãy di chuyển nó vào đó.");
                return; // Dừng lại, không xóa item
            }

            GameObject droppedItem = PhotonNetwork.Instantiate(
                prefabName,
                dropPosition.position,
                dropPosition.rotation
            );

            // ... (Logic add force giữ nguyên)
            Rigidbody rb = droppedItem.GetComponent<Rigidbody>();
            if (rb != null) rb.AddForce(dropPosition.forward * dropForce, ForceMode.Impulse);

            // Chỉ xóa item khi spawn thành công
            RemoveItem(itemToDrop);
        }
    }

    public void UseCurrentItem()
    {
        UseItem(currentSlotIndex);
    }

    // --- LOGIC NỘI BỘ (Private Helpers) ---

    private void EquipCurrentItem()
    {
        if (_playerInteract == null) return;

        if (currentSlotIndex < items.Count)
        {
            ItemDataSO item = items[currentSlotIndex];
            if (item.itemHandModel != null)
                _playerInteract.AttachHeldItem(item.itemHandModel);
            else
                _playerInteract.DetachHeldItem();
        }
        else
        {
            _playerInteract.DetachHeldItem();
        }
    }

    public bool AddItem(ItemDataSO newItem)
    {
        if (items.Count >= maxSlots) return false;

        items.Add(newItem);
        Debug.Log($"[Inventory] Đã nhặt: {newItem.itemName}");

        OnGlobalItemAdded?.Invoke(newItem, this);
        OnInventoryChanged?.Invoke();

        if (items.Count - 1 == currentSlotIndex) EquipCurrentItem();

        return true;
    }

    public bool RemoveItem(ItemDataSO item)
    {
        if (!items.Contains(item)) return false;

        items.Remove(item);
        OnInventoryChanged?.Invoke();
        EquipCurrentItem();

        return true;
    }

    public bool HasItem(ItemDataSO item) => items.Contains(item);

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
}