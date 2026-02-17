using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;

public class ResultRowUI : MonoBehaviour
{
    [Header("UI References (Theo Hierarchy Grp_PlayerResultItem)")]
    [SerializeField] private Image _imgBG;
    [SerializeField] private TextMeshProUGUI _txtName;
    [SerializeField] private TextMeshProUGUI _txtStatus;     // Map với Txt_Status
    [SerializeField] private Transform _rankTitleContainer;  // Map với Grp_RankTitle
    [SerializeField] private TextMeshProUGUI _txtExp;
    [SerializeField] private TextMeshProUGUI _txtCoin;

    [Header("Settings")]
    [SerializeField] private Color _myHighlightColor = new Color(1f, 0.8f, 0f, 0.2f); // Vàng nhạt trong suốt
    [SerializeField] private Color _normalColor = new Color(0f, 0f, 0f, 0.5f); // Đen mờ

    public void Setup(string name, string outcome, int duration, int exp, int coin, List<string> titles, bool isMe)
    {
        // 1. Tên
        _txtName.text = name;

        // 2. Status & Time: "THOÁT (12:30)"
        string timeStr = System.TimeSpan.FromSeconds(duration).ToString(@"mm\:ss");
        string statusText = "";
        
        if (outcome == "ESCAPED")
            statusText = "<color=#00FF00>THOÁT</color>"; // Xanh lá
        else
            statusText = "<color=#FF0000>BỊ BẮT</color>"; // Đỏ

        _txtStatus.text = $"{statusText} <size=80%>({timeStr})</size>";

        // 3. Exp & Coin
        _txtExp.text = $"+{exp}";
        _txtCoin.text = $"+{coin}";

        // 4. Highlight bản thân
        if (_imgBG != null)
        {
            _imgBG.color = isMe ? _myHighlightColor : _normalColor;
        }
        if (isMe) _txtName.color = Color.yellow; // Tô vàng tên mình luôn cho nổi

        // 5. Rank Titles (Icon 5 ô vuông trắng trong hình)
        // Logic: Duyệt qua các con của Grp_RankTitle và bật lên tương ứng số lượng title
        int titleCount = titles != null ? titles.Count : 0;
        int childCount = _rankTitleContainer.childCount;

        for (int i = 0; i < childCount; i++)
        {
            Transform child = _rankTitleContainer.GetChild(i);
            // Bật nếu index < số lượng title nhận được
            child.gameObject.SetActive(i < titleCount);
            
            // TODO: Nếu sau này bạn muốn đổi Sprite icon theo tên Title:
            // if (i < titleCount) child.GetComponent<Image>().sprite = GetSprite(titles[i]);
        }
    }
}