using UnityEngine;
using TMPro;
using UnityEngine.UI;
using GhostVillage.Domain.Profile;

public class Item_AchievementUI : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI _txtName;
    [SerializeField] private TextMeshProUGUI _txtDesc;
    [SerializeField] private TextMeshProUGUI _txtRewardExp;
    [SerializeField] private TextMeshProUGUI _txtRewardCoin;
    [SerializeField] private TextMeshProUGUI _txtProgress; // "17/50"

    // [THÊM MỚI]: Kéo cái nút Claim và Text của cái nút vào đây!
    [SerializeField] private Button _btnClaim;
    [SerializeField] private TextMeshProUGUI _txtBtnClaim;

    public void Setup(QuestItemDTO data, System.Action onClaim)
    {
        _txtName.text = data.title;
        _txtDesc.text = data.desc;
        _txtRewardExp.text = data.reward != null ? data.reward.exp.ToString() : "0";
        _txtRewardCoin.text = data.reward != null ? data.reward.coin.ToString() : "0";

        _txtProgress.text = $"{data.current}/{data.target}";

        // ==========================================
        // LOGIC NÚT NHẬN THƯỞNG
        // ==========================================
        if (_btnClaim == null) return;

        // Xóa sạch sự kiện cũ để tránh bị gọi x2 x3 khi ScrollView tái sử dụng
        _btnClaim.onClick.RemoveAllListeners();

        if (data.isClaimed)
        {
            // Trường hợp 1: Đã húp rồi
            _btnClaim.interactable = false;
            if (_txtBtnClaim != null) _txtBtnClaim.text = "Claimed";
        }
        else if (data.current >= data.target)
        {
            // Trường hợp 2: Đủ chỉ tiêu, cho húp
            _btnClaim.interactable = true;
            if (_txtBtnClaim != null) _txtBtnClaim.text = "Claim";

            _btnClaim.onClick.AddListener(() =>
            {
                _btnClaim.interactable = false; // Bóp nút phát là khóa luôn tránh spam click liên tục
                onClaim?.Invoke();
            });
        }
        else
        {
            // Trường hợp 3: Chưa cày xong
            _btnClaim.interactable = false;
            if (_txtBtnClaim != null) _txtBtnClaim.text = "Not Reached";
        }
    }
}