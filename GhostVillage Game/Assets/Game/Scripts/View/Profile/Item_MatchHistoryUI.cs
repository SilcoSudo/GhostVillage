using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using GhostVillage.Domain.Profile;
using System.Linq;

public class Item_MatchHistoryUI : MonoBehaviour {
    [SerializeField] private TextMeshProUGUI _txtResult;
    [SerializeField] private TextMeshProUGUI _txtDuration;
    [SerializeField] private TextMeshProUGUI _txtExp;
    [SerializeField] private TextMeshProUGUI _txtCoin;
    [SerializeField] private TextMeshProUGUI _txtMap;

    [Header("Titles Settings")]
    [SerializeField] private Image[] _rankTitleSlots; 
    
    [SerializeField] private List<TitleSpriteMapping> _titleLibrary;

    [System.Serializable]
    public struct TitleSpriteMapping {
        public string titleId;
        public Sprite titleIcon;
    }

    // Mảng định nghĩa thứ tự cố định của các Title trên UI
    // Thứ tự này phải khớp với vị trí các ô Image trong mảng _rankTitleSlots
    private readonly string[] _fixedTitleOrder = {
        "GrimReaper",      // Ô 0
        "PrimeTarget",     // Ô 1
        "WalkingHospital", // Ô 2
        "PunchingBag",     // Ô 3
        "HumanSiren"       // Ô 4
    };

    public void Setup(MatchHistoryItemDTO data) {
        _txtResult.text = data.isWin ? "Win" : "Lose";
        _txtResult.color = data.isWin ? Color.green : Color.red;
        _txtDuration.text = $"{data.durationSec / 60}m";
        _txtExp.text = data.expGained.ToString();
        _txtCoin.text = data.coinGained.ToString();
        _txtMap.text = data.matchId.mapName;

        // Xử lý Rank Titles theo vị trí cố định
        for (int i = 0; i < _rankTitleSlots.Length; i++) {
            // Lấy ID tiêu chuẩn cho vị trí ô này
            if (i >= _fixedTitleOrder.Length) break; 
            string targetTitleId = _fixedTitleOrder[i];

            // Kiểm tra xem trong dữ liệu trận đấu (data.rankTitles) có chứa ID này không
            bool hasThisTitle = data.rankTitles.Contains(targetTitleId);

            if (hasThisTitle) {
                // Nếu có: Tìm icon trong thư viện và hiển thị
                Sprite icon = GetSpriteFromLibrary(targetTitleId);
                _rankTitleSlots[i].sprite = icon;
                _rankTitleSlots[i].color = Color.white;
                
                // Case phòng hờ: Nếu backend gửi ID đúng nhưng thư viện Unity chưa gán sprite
                if (icon == null) _rankTitleSlots[i].color = Color.black;
            } else {
                // Nếu không có: Trả về nền đen
                _rankTitleSlots[i].sprite = null;
                _rankTitleSlots[i].color = Color.black;
            }
            
            // Luôn bật object để hiện ô đen hoặc icon
            _rankTitleSlots[i].gameObject.SetActive(true);
        }
    }

    private Sprite GetSpriteFromLibrary(string id) {
        var mapping = _titleLibrary.Find(x => x.titleId == id);
        return mapping.titleIcon;
    }
}