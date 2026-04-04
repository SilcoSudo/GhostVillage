using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using GhostVillage.Domain.Profile;

// 1. IMPORT NAMESPACE CHỨA SCRIPT NÚT CHUNG
using Game.Scripts.View; // Nhớ check lại namespace này nhe sếp

namespace Game.Scripts.UI.Lobby
{
    public class Item_DailyQuestUI : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI _txtTitle;
        [SerializeField] private TextMeshProUGUI _txtProgress;
        [SerializeField] private Button _btnClaim;
        [SerializeField] private TextMeshProUGUI _txtBtnClaim;

        public void Setup(QuestItemDTO data, Action onClaimClicked)
        {
            _txtTitle.text = data.title;
            _txtProgress.text = $"({data.current}/{data.target})";

            _btnClaim.onClick.RemoveAllListeners();

            // 2. TÌM CÁI SCRIPT NÚT CHUNG GẮN TRÊN Ô NÚT
            var advBtn = _btnClaim.GetComponent<AdvancedButtonTransition>();

            if (data.isClaimed)
            {
                // Đã nhận: Khóa nút, đổi chữ, đổi màu xám mờ
                _btnClaim.interactable = false;
                _txtBtnClaim.text = "Claimed";
                _txtBtnClaim.color = new Color(0.5f, 0.5f, 0.5f, 0.5f); // Xám mờ

                // 3. [FIX] RÚT ĐIỆN CÁI SCRIPT HOVER LUÔN
                if (advBtn != null) advBtn.enabled = false;
            }
            else if (data.current >= data.target)
            {
                // Hoàn thành nhưng chưa nhận: Mở nút, gán sự kiện, màu highlight
                _btnClaim.interactable = true;
                _txtBtnClaim.text = "Claim";
                _txtBtnClaim.color = new Color32(240, 163, 64, 255); // F0A340
                _btnClaim.onClick.AddListener(() => onClaimClicked?.Invoke());

                // 4. [FIX] CẮM ĐIỆN LẠI CHO NÓ HOVER ĐƯỢC
                if (advBtn != null) advBtn.enabled = true;
            }
            else
            {
                // Chưa hoàn thành: Khóa nút, giữ nguyên chữ Claim, màu xám mặc định
                _btnClaim.interactable = false;
                _txtBtnClaim.text = "Claim";
                _txtBtnClaim.color = new Color32(160, 160, 146, 255); // A0A092

                // 5. [FIX] RÚT ĐIỆN LUÔN CHO KHỎI HOVER
                if (advBtn != null) advBtn.enabled = false;
            }
        }
    }
}