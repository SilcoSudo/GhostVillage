using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using Game.Scripts.Gameplay.Result; // Để lấy TitleNames

public class ResultRowUI : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private Image _imgBG;
    [SerializeField] private TextMeshProUGUI _txtName;
    [SerializeField] private TextMeshProUGUI _txtStatus;     // Map với Txt_Status
    [SerializeField] private TextMeshProUGUI _txtDuration;   // [MỚI THÊM] Map với Txt_Duration
    [SerializeField] private TextMeshProUGUI _txtExp;
    [SerializeField] private TextMeshProUGUI _txtCoin;

    [Header("5 Titles Icons (Fix thứ tự)")]
    // [0]: Grim Reaper, [1]: Prime Target, [2]: Walking Hospital, [3]: Punching Bag, [4]: Human Siren
    [SerializeField] private Image[] _titleImages = new Image[5];

    [Header("Settings")]
    [SerializeField] private Color _myHighlightColor = new Color(1f, 0.8f, 0f, 0.2f); // Vàng nhạt trong suốt
    [SerializeField] private Color _normalColor = new Color(0f, 0f, 0f, 0.5f); // Đen mờ

    // Màu cho Title (Trắng = Đạt được, Xám mờ = Không đạt)
    private Color _colorActive = Color.white;
    private Color _colorInactive = new Color(0.2f, 0.2f, 0.2f, 0.5f);

    public void Setup(string name, string outcome, int duration, int exp, int coin, List<string> earnedTitles, bool isMe)
    {
        string logTitles = earnedTitles != null ? string.Join(", ", earnedTitles) : "Null";
        Debug.Log($"[UI] Player: {name} - Titles nhận được: {logTitles}");

        // 1. Tên
        _txtName.text = name;

        // 2. Trạng thái (Đỏ/Xanh)
        if (outcome == "ESCAPED")
            _txtStatus.text = "<color=#00FF00>THOÁT</color>";
        else
            _txtStatus.text = "<color=#FF0000>BỊ BẮT</color>";

        // 3. Thời gian (Ghi riêng rẽ ra slot Txt_Duration)
        if (_txtDuration != null)
        {
            _txtDuration.text = System.TimeSpan.FromSeconds(Mathf.Abs(duration)).ToString(@"mm\:ss");
        }

        // 4. Exp & Coin
        _txtExp.text = $"+{exp}";
        _txtCoin.text = $"+{coin}";

        // 5. Highlight bản thân
        if (_imgBG != null)
        {
            _imgBG.color = isMe ? _myHighlightColor : _normalColor;
        }
        if (isMe) _txtName.color = Color.yellow;

        // 6. --- Xử lý 5 Slot Title bằng Filter Màu ---
        if (earnedTitles == null) earnedTitles = new List<string>();

        if (_titleImages.Length > 0 && _titleImages[0] != null)
            _titleImages[0].color = earnedTitles.Contains(TitleNames.GRIM_REAPER) ? _colorActive : _colorInactive;

        if (_titleImages.Length > 1 && _titleImages[1] != null)
            _titleImages[1].color = earnedTitles.Contains(TitleNames.PRIME_TARGET) ? _colorActive : _colorInactive;

        if (_titleImages.Length > 2 && _titleImages[2] != null)
            _titleImages[2].color = earnedTitles.Contains(TitleNames.WALKING_HOSPITAL) ? _colorActive : _colorInactive;

        if (_titleImages.Length > 3 && _titleImages[3] != null)
            _titleImages[3].color = earnedTitles.Contains(TitleNames.PUNCHING_BAG) ? _colorActive : _colorInactive;

        if (_titleImages.Length > 4 && _titleImages[4] != null)
            _titleImages[4].color = earnedTitles.Contains(TitleNames.HUMAN_SIREN) ? _colorActive : _colorInactive;
    }
}