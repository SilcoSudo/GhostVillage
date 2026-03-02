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
            iconImage.sprite = item.itemIcon;
            iconImage.color = Color.white;
            iconImage.enabled = true;
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