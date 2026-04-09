using UnityEngine;
using UnityEngine.UI;

public class InventorySlotUI : MonoBehaviour
{
    [Header("References")]
    public Image borderImage; // Kéo cái Image viền (100x100) vào đây
    public Image iconImage;   // Kéo cái Image Icon (90x90) vào đây

    [Header("Visual Settings")]
    [SerializeField] private Color focusedColor = Color.white;
    [SerializeField] private Color unfocusedColor = new Color(0.5f, 0.5f, 0.5f, 1f); // Xám

    // Hàm set đồ (giữ nguyên logic cũ nhưng gọn hơn)
    public void SetItem(ItemDataSO item)
    {
        if (item != null)
        {
            if (item.itemIcon != null)
            {
                iconImage.sprite = item.itemIcon;
                iconImage.color = Color.white;
                iconImage.enabled = true;
                Debug.Log($"[InventorySlot] SetItem '{item.itemName}': sprite={item.itemIcon.name}");
            }
            else
            {
                // Fallback: show colored placeholder nếu icon missing
                iconImage.sprite = null;
                iconImage.color = new Color(0.3f, 0.7f, 0.3f, 1f); // Green placeholder
                iconImage.enabled = true;
                Debug.LogWarning($"[InventorySlot] Item '{item.itemName}' có icon NULL! Showing placeholder color.");
            }
        }
        else
        {
            Clear();
        }
    }

    public void Clear()
    {
        iconImage.sprite = null;
        iconImage.enabled = false;
        iconImage.color = Color.clear;
    }

    // HÀM MỚI: Đổi màu viền dựa trên trạng thái chọn
    public void SetSelected(bool isSelected)
    {
        if (borderImage != null)
        {
            borderImage.color = isSelected ? focusedColor : unfocusedColor;
        }
    }
}