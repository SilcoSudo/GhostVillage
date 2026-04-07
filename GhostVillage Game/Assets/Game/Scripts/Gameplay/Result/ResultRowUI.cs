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

    [Header("Title Library")]
    [SerializeField] private List<TitleSpriteMapping> _titleLibrary;

    [Header("Settings")]
    [SerializeField] private Color _myHighlightColor = new Color(1f, 0.8f, 0f, 0.2f); // Vàng nhạt trong suốt
    [SerializeField] private Color _normalColor = new Color(0f, 0f, 0f, 0.5f); // Đen mờ

    // Màu cho Title (Trắng = Đạt được, Đen mờ = Không đạt)
    private Color _colorActive = Color.white;
    private Color _colorInactive = new Color(0.2f, 0.2f, 0.2f, 0.5f);

    [System.Serializable]
    public struct TitleSpriteMapping
    {
        public string titleId;
        public Sprite titleIcon;
    }

    // Mảng định nghĩa thứ tự cố định của các Title trên UI
    private readonly string[] _fixedTitleOrder = {
        TitleNames.GRIM_REAPER,      // Ô 0
        TitleNames.PRIME_TARGET,     // Ô 1
        TitleNames.WALKING_HOSPITAL, // Ô 2
        TitleNames.PUNCHING_BAG,     // Ô 3
        TitleNames.HUMAN_SIREN       // Ô 4
    };

    public void Setup(string name, string outcome, int duration, int exp, int coin, List<string> earnedTitles, bool isMe)
    {
        string logTitles = earnedTitles != null ? string.Join(", ", earnedTitles) : "Null";
        Debug.Log($"[UI] Player: {name} - Titles nhận được: {logTitles}");

        // 1. Tên
        _txtName.text = name;

        // 2. Trạng thái (Đỏ/Xanh)
        if (outcome == "ESCAPED")
            _txtStatus.text = "<color=#00FF00>ESCAPED</color>";
        else
            _txtStatus.text = "<color=#FF0000>CAUGHT</color>";

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

        // 6. --- Xử lý 5 Slot Title ---
        if (earnedTitles == null) earnedTitles = new List<string>();

        for (int i = 0; i < _titleImages.Length; i++)
        {
            if (i >= _fixedTitleOrder.Length) break;

            string targetTitleId = _fixedTitleOrder[i];
            bool hasThisTitle = earnedTitles.Contains(targetTitleId);

            if (_titleImages[i] != null)
            {
                // Gán hình từ thư viện
                Sprite icon = GetSpriteFromLibrary(targetTitleId);
                _titleImages[i].sprite = icon;

                // Áp màu (sáng nếu có, tối nếu không)
                if (hasThisTitle && icon != null)
                {
                    _titleImages[i].color = _colorActive;
                }
                else
                {
                    _titleImages[i].color = _colorInactive;
                }

                _titleImages[i].gameObject.SetActive(true);
            }
        }
    }

    private Sprite GetSpriteFromLibrary(string id)
    {
        if (_titleLibrary == null) return null;
        var mapping = _titleLibrary.Find(x => x.titleId == id);
        return mapping.titleIcon; // Nếu không tìm thấy thì trả về null
    }
}