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

    public void Setup(QuestItemDTO data, System.Action onClaim)
    {
        _txtName.text = data.title;
        _txtDesc.text = data.desc;
        // Kiểm tra null cho reward trước khi gán
        _txtRewardExp.text = data.reward != null ? data.reward.exp.ToString() : "0";
        _txtRewardCoin.text = data.reward != null ? data.reward.coin.ToString() : "0";

        _txtProgress.text = $"{data.current}/{data.target}";

        // Logic hiển thị nút Nhận thưởng
        bool canClaim = data.current >= data.target && !data.isClaimed;
    }
}