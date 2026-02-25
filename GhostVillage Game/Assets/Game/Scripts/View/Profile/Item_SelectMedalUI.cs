using GhostVillage.Domain.Profile;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class Item_SelectMedalUI : MonoBehaviour {
    [SerializeField] private Image _imgMedal;
    [SerializeField] private TextMeshProUGUI _txtName;
    [SerializeField] private GameObject _imgCheckmark;
    [SerializeField] private Button _btnClick;

    public void Setup(AchievementItemDTO data, bool isSelected, Sprite medalSprite, System.Action onToggle) {
        _txtName.text = data.title;
        
        // Gán Sprite đã được tìm thấy từ thư viện
        if (_imgMedal != null && medalSprite != null) {
            _imgMedal.sprite = medalSprite;
        }

        // Hiện dấu tích nếu huy chương nằm trong danh sách đang chọn
        _imgCheckmark.SetActive(isSelected);

        _btnClick.onClick.RemoveAllListeners();
        _btnClick.onClick.AddListener(() => onToggle?.Invoke());
    }
}
