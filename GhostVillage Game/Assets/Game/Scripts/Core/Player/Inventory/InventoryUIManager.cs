using UnityEngine;

public class InventoryUIManager : MonoBehaviour
{
    [Header("Inventory UI Slots")]
    public InventorySlotUI[] slots;

    [Header("Optional: Auto find Player Inventory")]
    public InventoryManager inventory; // có thể gán tay hoặc tự tìm


    void Start()
    {
        if (inventory == null)
        {
            // Tìm player thực sự trong scene
            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                inventory = player.GetComponent<InventoryManager>();
                Debug.Log($"[UI] Auto-bound to runtime player: {player.name}");
            }
            else
            {
                Debug.LogWarning("[UI] Không tìm thấy Player trong scene!");
            }
        }

        if (inventory != null)
            BindInventory(inventory);
    }


    public void BindInventory(InventoryManager inv)
    {
        Debug.Log($"[UI] Bound inventory from: {inv.gameObject.name}");

        // Unsubscribe event cũ nếu có
        if (inventory != null)
            inventory.OnInventoryChanged -= UpdateUI;

        inventory = inv;
        inventory.OnInventoryChanged += UpdateUI;

        UpdateUI();
    }

    private void OnDestroy()
    {
        if (inventory != null)
            inventory.OnInventoryChanged -= UpdateUI;
    }

    private void UpdateUI()
    {
        Debug.Log("[UI] UpdateUI called");
        if (inventory == null || slots == null)
        {
            Debug.LogWarning("[UI] UpdateUI bị gọi nhưng inventory hoặc slots null!");
            return;
        }

        // Reset tất cả slot trước
        foreach (var s in slots)
            s.SetItem(null);

        Debug.Log($"[UI] Updating UI - Inventory count: {inventory.items.Count}, Slot count: {slots.Length}");

        int currentSlot = 0;

        foreach (var item in inventory.items)
        {
            if (currentSlot >= slots.Length)
                break;

            // Slot đầu tiên hiển thị icon
            slots[currentSlot].SetItem(item);

            // Nếu item chiếm nhiều slot -> các slot kế cũng hiển thị cùng icon
            for (int i = 1; i < item.slotSize; i++)
            {
                int extraIndex = currentSlot + i;
                if (extraIndex < slots.Length)
                {
                    slots[extraIndex].SetItem(item); // Dùng cùng icon cho slot kế
                    slots[extraIndex].DimSlot(); // Làm mờ hoặc disable slot phụ
                }
            }


            currentSlot += item.slotSize;
        }
    }

}
