using UnityEngine;

public class InventoryUIManager : MonoBehaviour
{
    [Header("UI Slots")]
    public InventorySlotUI[] slots;

    private InventoryManager _inventory;

    // Auto-bind với InventoryManager.LocalInstance khi Start
    private void Start()
    {
        if (InventoryManager.LocalInstance != null)
        {
            BindInventory(InventoryManager.LocalInstance);
        }
        else
        {
            Debug.LogWarning("[InventoryUI] InventoryManager.LocalInstance chưa được set!");
        }
    }

    public void BindInventory(InventoryManager inv)
    {
        // Logic hủy đăng ký cũ (để tránh memory leak khi bind lại)
        if (_inventory != null)
        {
            _inventory.OnInventoryChanged -= UpdateUI;
            _inventory.OnSlotChanged -= UpdateSelectionUI;
        }

        _inventory = inv;

        // Logic đăng ký mới
        if (_inventory != null)
        {
            _inventory.OnInventoryChanged += UpdateUI;
            _inventory.OnSlotChanged += UpdateSelectionUI;

            // Cập nhật ngay lập tức
            UpdateUI();
            UpdateSelectionUI(_inventory.currentSlotIndex);
        }
    }

    private void UpdateUI()
    {
        if (_inventory == null || slots == null) return;
        var items = _inventory.items;

        for (int i = 0; i < slots.Length; i++)
        {
            if (i < items.Length && items[i] != null) slots[i].SetItem(items[i]);
            else slots[i].Clear();
        }
    }

    private void UpdateSelectionUI(int selectedIndex)
    {
        for (int i = 0; i < slots.Length; i++)
        {
            slots[i].SetSelected(i == selectedIndex);
        }
    }

    // Khi UI bị hủy (chuyển scene), tự động gỡ event cho chắc ăn
    private void OnDestroy()
    {
        if (_inventory != null)
        {
            _inventory.OnInventoryChanged -= UpdateUI;
            _inventory.OnSlotChanged -= UpdateSelectionUI;
        }
    }
}