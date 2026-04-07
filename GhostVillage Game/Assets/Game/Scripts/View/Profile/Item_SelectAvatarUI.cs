using UnityEngine;
using UnityEngine.UI;
using System;

public class Item_SelectAvatarUI : MonoBehaviour
{
    [Header("--- UI References ---")]
    [Tooltip("Thằng cha (100x100) dùng làm viền")]
    [SerializeField] private Image _imgBackground; 
    
    [Tooltip("Thằng con (90x90) hiển thị hình Avatar")]
    [SerializeField] private Image _imgAvatarIcon; 
    
    [SerializeField] private Button _btnClick;

    [Header("--- Colors ---")]
    [Tooltip("Màu viền khi KHÔNG chọn")]
    [SerializeField] private Color _normalColor = new Color(0.2f, 0.2f, 0.2f, 1f); // Xám đen
    
    [Tooltip("Màu viền khi ĐƯỢC chọn")]
    [SerializeField] private Color _selectedColor = Color.yellow; // Vàng chóe nổi bật

    private string _myAvatarId;

    public void Setup(string avatarId, Sprite icon, bool isSelected, Action<string> onClick)
    {
        _myAvatarId = avatarId;

        if (_imgAvatarIcon != null && icon != null)
        {
            _imgAvatarIcon.sprite = icon;
        }

        SetSelectedVisual(isSelected);

        if (_btnClick != null)
        {
            _btnClick.onClick.RemoveAllListeners();
            // Bắn ID của chính nó lên cho thằng Manager xử lý
            _btnClick.onClick.AddListener(() => onClick?.Invoke(_myAvatarId));
        }
    }

    // Đổi màu cái viền (Thằng cha)
    public void SetSelectedVisual(bool isSelected)
    {
        if (_imgBackground != null)
        {
            _imgBackground.color = isSelected ? _selectedColor : _normalColor;
        }
    }

    public string GetAvatarId() => _myAvatarId;
}