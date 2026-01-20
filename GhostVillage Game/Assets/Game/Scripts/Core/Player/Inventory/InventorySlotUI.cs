using UnityEngine;
using UnityEngine.UI;

public class InventorySlotUI : MonoBehaviour
{
    public Image icon;

    public void SetItem(KeyItemData item)
    {
        if (item == null)
        {
            Debug.Log($"[UI SLOT] {name}: cleared (no item)");
            icon.enabled = false;
        }
        else
        {
            Debug.Log($"[UI SLOT] {name}: set icon = {item.icon}, name = {item.itemName}");
            icon.enabled = true;
            icon.sprite = item.icon;
        }
    }

    public void DimSlot()
    {
        // Ví dụ: giảm alpha ảnh xuống hoặc disable button
        var img = GetComponent<UnityEngine.UI.Image>();
        if (img != null)
            img.color = new Color(img.color.r, img.color.g, img.color.b, 0.4f);

        var btn = GetComponent<UnityEngine.UI.Button>();
        if (btn != null)
            btn.interactable = false;
    }
}
