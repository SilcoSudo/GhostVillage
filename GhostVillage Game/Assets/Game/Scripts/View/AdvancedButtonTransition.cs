using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;

[RequireComponent(typeof(Image))] // Bắt buộc object này phải có Image component, khỏi cần kéo thả
public class AdvancedButtonTransition : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerDownHandler, IPointerUpHandler
{
    [Header("--- References ---")]
    [SerializeField] private TextMeshProUGUI _buttonText; // Chỉ cần kéo cục Text vào đây

    [Header("--- Sprites ---")]
    [SerializeField] private Sprite _normalSprite;
    [SerializeField] private Sprite _hoverSprite;

    [Header("--- Text Colors ---")]
    [SerializeField] private Color _normalTextColor = new Color32(160, 160, 146, 255);  // A0A092 (Màu xám mặc định)
    [SerializeField] private Color _hoverTextColor = new Color32(240, 163, 64, 255);   // F0A340 (Màu cam sáng)
    [SerializeField] private Color _pressedTextColor = new Color32(200, 110, 30, 255); // (Cam sậm hơn khi ấn)

    private Image _image;
    private bool _isHovered = false;

    private void Awake()
    {
        // Tự động tìm Component Image gắn trên Nút, sếp không cần kéo tay nữa
        _image = GetComponent<Image>();

        // Tự động tìm TextMeshProUGUI nếu sếp quên kéo vào
        if (_buttonText == null) _buttonText = GetComponentInChildren<TextMeshProUGUI>();

        SetStateNormal();
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        _isHovered = true;
        SetStateHover();
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        _isHovered = false;
        SetStateNormal();
    }

    public void OnPointerDown(PointerEventData eventData)
    {
        SetStatePressed();
    }

    public void OnPointerUp(PointerEventData eventData)
    {
        if (_isHovered) SetStateHover();
        else SetStateNormal();
    }

    private void SetStateNormal()
    {
        if (_image != null && _normalSprite != null) _image.sprite = _normalSprite;
        if (_buttonText != null) _buttonText.color = _normalTextColor;
    }

    private void SetStateHover()
    {
        if (_image != null && _hoverSprite != null) _image.sprite = _hoverSprite;
        if (_buttonText != null) _buttonText.color = _hoverTextColor;
    }

    private void SetStatePressed()
    {
        // Khi ấn xuống: Dùng nền Hover, nhưng đổi màu chữ thành màu Pressed sậm hơn
        if (_image != null && _hoverSprite != null) _image.sprite = _hoverSprite;
        if (_buttonText != null) _buttonText.color = _pressedTextColor;
    }
}