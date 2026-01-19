using System;
using System.Collections.Generic;
using UnityEngine;

public class InventoryManager : MonoBehaviour
{
    public int maxSlots = 3;
    public List<KeyItemData> items = new();

    public event Action OnInventoryChanged;
    public event Action<KeyItemData, InventoryManager> OnItemAdded;


    public int SlotsUsed()
    {
        int total = 0;
        foreach (var item in items)
            total += item.slotSize;
        return total;
    }

    public bool AddItem(KeyItemData newItem)
    {
        Debug.Log($"[INVENTORY] This is {gameObject.name} inventory");

        if (items.Contains(newItem))
        {
            Debug.Log($"{newItem.itemName} đã có trong túi!");
            return false;
        }

        if (SlotsUsed() + newItem.slotSize > maxSlots)
        {
            Debug.Log("Túi đầy rồi!");
            return false;
        }

        items.Add(newItem);
        Debug.Log($"[INVENTORY] Đã nhặt: {newItem.itemName}");
        OnInventoryChanged?.Invoke();
        OnItemAdded?.Invoke(newItem, this);

        GameManager.Instance?.NotifyItemPickup(newItem, this);



        Debug.Log("LMAOOOOO");

        return true;
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
