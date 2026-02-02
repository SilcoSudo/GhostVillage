using System;
using System.Collections.Generic;
using UnityEngine;

public class InventoryManager : MonoBehaviour
{
    public int maxSlots = 3;
    public List<KeyItemData> items = new();

    // Event tĩnh (Static) để ObjectiveManager có thể nghe mà không cần tìm reference tới từng Player
    // Param 1: Item vừa nhặt, Param 2: Ai nhặt (Inventory nào)
    public static event Action<KeyItemData, InventoryManager> OnGlobalItemAdded;

    public event Action OnInventoryChanged; // Dùng cho UI cục bộ

    public bool AddItem(KeyItemData newItem)
    {
        if (items.Contains(newItem) || SlotsUsed() + newItem.slotSize > maxSlots) return false;

        items.Add(newItem);

        // Bắn pháo hiệu: "Alo, có thằng vừa nhặt đồ nè!"
        // Ai quan tâm (UI, Objective, Sound) thì tự nghe, tao không quan tâm.
        OnGlobalItemAdded?.Invoke(newItem, this);
        OnInventoryChanged?.Invoke();

        return true;
    }

    public int SlotsUsed()
    {
        int total = 0;
        foreach (var item in items)
        {
            if (item != null) total += item.slotSize;
        }
        return total;
    }

    public bool RemoveItem(KeyItemData item)
    {
        if (!items.Contains(item)) return false;
        items.Remove(item);
        OnInventoryChanged?.Invoke();
        return true;
    }

    public bool HasItem(KeyItemData item) => items.Contains(item);
}
