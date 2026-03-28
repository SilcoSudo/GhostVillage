using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using GhostVillage.Domain.Profile; // Nhớ đổi đúng Namespace chứa DTO của sếp

namespace Game.Scripts.UI.Lobby
{
    public class Item_DailyQuestUI : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI _txtTitle;
        [SerializeField] private TextMeshProUGUI _txtProgress;
        [SerializeField] private Button _btnClaim;
        [SerializeField] private TextMeshProUGUI _txtBtnClaim;

        // Dùng chung AchievementItemDTO như đã chốt ở GĐ trước
        public void Setup(QuestItemDTO data, Action onClaimClicked)
        {
            _txtTitle.text = data.title;
            _txtProgress.text = $"({data.current}/{data.target})";

            _btnClaim.onClick.RemoveAllListeners();

            if (data.isClaimed)
            {
                _btnClaim.interactable = false;
                _txtBtnClaim.text = "ĐÃ NHẬN";
                _txtBtnClaim.color = Color.gray;
            }
            else if (data.current >= data.target)
            {
                _btnClaim.interactable = true;
                _txtBtnClaim.text = "NHẬN THƯỞNG";
                _txtBtnClaim.color = Color.green;
                _btnClaim.onClick.AddListener(() => onClaimClicked?.Invoke());
            }
            else
            {
                _btnClaim.interactable = false;
                _txtBtnClaim.text = "CHƯA XONG";
                _txtBtnClaim.color = Color.white;
            }
        }
    }
}