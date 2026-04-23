using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System.Linq;
using TMPro;

namespace GhostVillage.Shop 
{
    public class ShopManager : MonoBehaviour 
    {
        [Header("--- DATA SOURCE ---")]
        public ItemDatabaseSO database;
        
        // Danh sách ID Perk đã sở hữu
        public List<string> ownedItemIds = new List<string>(); 

        public TextMeshProUGUI txtCoinCount; // Số xu hiện tại của người chơi

        [Header("--- NAVIGATION ---")]
        public Button btnBack;
        public Action OnBackRequested;

        [Header("--- PERK TAB UI ---")]
        public GameObject perkSlotPrefab;
        public Transform perkGridContainer; // Dùng GridLayoutGroup
        public TextMeshProUGUI txtResetTimer;

        [Header("--- PERK DETAIL PANEL ---")]
        public GameObject grpPerkRightPanel; 
        public Image imgDetailIcon;
        public TextMeshProUGUI txtDetailName;
        public TextMeshProUGUI txtDetailDesc;
        public TextMeshProUGUI txtDetailPrice;
        public Button btnBuyPerk;
        public TextMeshProUGUI txtBtnBuyPerk;

        [Header("--- RARITY COLORS ---")]
        public Color colorCommon = Color.gray;
        public Color colorRare = Color.blue;
        public Color colorEpic = new Color(0.6f, 0, 1); // Màu tím

        private PerkSO selectedPerk;
        public Action<PerkSO> OnBuyPerkRequest;
        private List<PerkSO> _lastLoadedPerks;

        private void Start()
        {
            if (btnBack != null)
            {
                btnBack.onClick.AddListener(() => OnBackRequested?.Invoke());
            }
            
            // Ẩn bảng chi tiết Perk lúc bắt đầu cho đến khi có item được chọn
            if (grpPerkRightPanel != null) grpPerkRightPanel.SetActive(false);
        }

        // ==========================================
        // 1. LOGIC PERK SHOP
        // ==========================================
        
        /// <summary>
        /// Nạp danh sách Perk vào UI
        /// </summary>
        public void PopulatePerks(List<PerkSO> perks, List<string> ownedPerkIds)
        {
            _lastLoadedPerks = perks; 
            this.ownedItemIds = ownedPerkIds; 

            foreach (Transform child in perkGridContainer) Destroy(child.gameObject);

            // Tự động ẩn bảng chi tiết khi nạp danh sách mới (chưa ai chọn gì)
            if (grpPerkRightPanel != null) grpPerkRightPanel.SetActive(false);

            // Sắp xếp Perk theo độ hiếm trước khi hiển thị
            var sortedPerks = perks.OrderBy(p => GetRarityWeight(p.rarity.ToString())).ToList();

            foreach (var perk in sortedPerks)
            {
                GameObject go = Instantiate(perkSlotPrefab, perkGridContainer);
                var slot = go.GetComponent<PerkSlotUI>();

                bool isOwned = ownedItemIds.Contains(perk.prefabId);
                Color rColor = GetColorByRarity(perk.rarity.ToString());

                slot.Setup(perk, isOwned, rColor);
                slot.slotButton.onClick.AddListener(() => OnPerkClicked(perk, isOwned));
            }
        }

        private void OnPerkClicked(PerkSO perk, bool isOwned)
        {
            selectedPerk = perk;

            // Hiển thị bảng chi tiết
            if (grpPerkRightPanel != null) grpPerkRightPanel.SetActive(true);

            txtDetailName.text = perk.itemName;
            txtDetailDesc.text = perk.description;
            
            btnBuyPerk.onClick.RemoveAllListeners();

            if (isOwned) {
                txtDetailPrice.text = "OWNED";
                txtDetailPrice.color = Color.green;
                btnBuyPerk.interactable = false;
                txtBtnBuyPerk.text = "Owned";
            } else {
                txtDetailPrice.text = $"{perk.price} Gold";
                txtDetailPrice.color = Color.white;
                btnBuyPerk.interactable = true;
                txtBtnBuyPerk.text = "Buy";

                btnBuyPerk.onClick.AddListener(() => {
                    OnBuyPerkRequest?.Invoke(perk);
                });
            }
            imgDetailIcon.sprite = perk.icon; 
        }

        /// <summary>
        /// Cập nhật trạng thái khi một Perk vừa được mua thành công
        /// </summary>
        public void MarkItemAsOwned(string prefabId)
        {
            if (!ownedItemIds.Contains(prefabId))
            {
                ownedItemIds.Add(prefabId);
            }

            // Vẽ lại danh sách để cập nhật trạng thái "Owned" trên các slot
            if (_lastLoadedPerks != null)
            {
                PopulatePerks(_lastLoadedPerks, ownedItemIds);
            }
            
            // Cập nhật lại bảng chi tiết nếu Perk đang chọn chính là Perk vừa mua
            if (selectedPerk != null && selectedPerk.prefabId == prefabId)
            {
                OnPerkClicked(selectedPerk, true);
            }
        }

        // ==========================================
        // 2. HELPER METHODS
        // ==========================================

        public void UpdateCoinUI(int amount)
        {
            if (txtCoinCount != null)
            {
                txtCoinCount.text = amount.ToString("N0"); 
            }
        }

        private int GetRarityWeight(string rarity)
        {
            switch (rarity.ToUpper()) {
                case "COMMON": return 1;
                case "RARE": return 2;
                case "EPIC": return 3;
                default: return 4;
            }
        }

        private Color GetColorByRarity(string rarity)
        {
            switch (rarity.ToUpper()) {
                case "COMMON": return colorCommon;
                case "RARE": return colorRare;
                case "EPIC": return colorEpic;
                default: return Color.white;
            }
        }
    }
}