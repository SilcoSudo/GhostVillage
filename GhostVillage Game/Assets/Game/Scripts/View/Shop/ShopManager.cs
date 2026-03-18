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
        public Action<ShopItemSO> OnBuyItemRequest;
        public Action<string, string> OnEquipItemRequest;

        [Header("--- DATA SOURCE ---")]
        public ItemDatabaseSO database;
        
        // Giả lập danh sách ID vật phẩm đã sở hữu (Sau này lấy từ Server về)
        public List<string> ownedItemIds = new List<string>(); 

        [Header("--- MAIN UI ---")]
        public GameObject skinScrollView; // Khu vực cuộn của Skin
        public TextMeshProUGUI txtCoinCount; // Số xu hiện tại của người chơi

        [Header("--- SUB TABS (Hats / Bodies) ---")]
        public Button btnSubTabHats;
        public Button btnSubTabBodies;

        [Header("--- CONTAINERS (Nơi chứa Item UI) ---")]
        public GameObject shopItemPrefab; // Prefab UI_ShopItemListBar
        public Transform listHatsContainer; 
        public Transform listBodiesContainer; 

        [Header("--- RIGHT PANEL (Info & Buy) ---")]
        public TextMeshProUGUI txtSelectedName;
        public TextMeshProUGUI txtSelectedPrice;
        public Button btnBuy;
        public TextMeshProUGUI txtBtnBuy; 

        [Header("--- PREVIEW SYSTEM ---")]
        public CharacterPreviewer characterPreviewer; // Nhân vật 3D đứng giữa

        private ShopItemSO currentlySelectedItem;

        [Header("--- PERK TAB UI ---")]
        public GameObject perkSlotPrefab;
        public Transform perkGridContainer; // Dùng GridLayoutGroup (2 cột)
        public TextMeshProUGUI txtResetTimer;

        [Header("--- PERK DETAIL PANEL ---")]
        public GameObject grpPerkRightPanel; // Kéo thả Object "Grp_Right" vào đây
        public Image imgDetailIcon;
        public TextMeshProUGUI txtDetailName;
        public TextMeshProUGUI txtDetailDesc;
        public TextMeshProUGUI txtDetailPrice;
        public Button btnBuyPerk;
        public TextMeshProUGUI txtBtnBuyPerk;

        [Header("--- MAIN TAB GROUPS ---")]
        public GameObject grpSkinTab; 
        public GameObject grpPerkTab;
        public Button btnTabSkins;
        public Button btnTabPerks;

        [Header("--- RARITY COLORS ---")]
        public Color colorCommon = Color.gray;
        public Color colorRare = Color.blue;
        public Color colorEpic = new Color(0.6f, 0, 1); // Màu tím

        private PerkSO selectedPerk;
        public Action<PerkSO> OnBuyPerkRequest;
        private List<PerkSO> _lastLoadedPerks;
        public enum ShopTab { Skins, Perks }

        private void Start()
        {
            PopulateShop();
            ClearSelection(); 

            // Mặc định bật bảng Skin và mở tab Hats khi vào Shop
            skinScrollView.SetActive(true);
            characterPreviewer.gameObject.SetActive(true);
            OpenSubTabHats();

            // Ẩn bảng chi tiết Perk lúc bắt đầu
            if (grpPerkRightPanel != null) grpPerkRightPanel.SetActive(false);
        }

        // ==========================================
        // 1. LOGIC KHỞI TẠO DỮ LIỆU (CHỈ COSMETIC)
        // ==========================================
        public void PopulateShop()
        {
            foreach (Transform child in listHatsContainer) Destroy(child.gameObject);
            foreach (Transform child in listBodiesContainer) Destroy(child.gameObject);

            foreach (ShopItemSO item in database.allItems)
            {
                if (item.GetItemType() == ItemType.COSMETIC)
                {
                    CosmeticSO cosmetic = (CosmeticSO)item;
                    Transform targetContainer = (cosmetic.cosmeticType == CosmeticType.Hat) ? listHatsContainer : listBodiesContainer;

                    if (targetContainer != null)
                    {
                        GameObject newSlot = Instantiate(shopItemPrefab, targetContainer);
                        ShopItemSlotUI slotUI = newSlot.GetComponent<ShopItemSlotUI>();

                        bool isOwned = ownedItemIds.Contains(item.prefabId);
                        slotUI.SetupSlot(item, isOwned);

                        slotUI.slotButton.onClick.AddListener(() => OnItemClicked(item, isOwned));
                    }
                }
            }
        }

        // ==========================================
        // 2. LOGIC CHUYỂN SUB TABS (HATS / BODIES)
        // ==========================================
        public void OpenSubTabHats()
        {
            listHatsContainer.gameObject.SetActive(true);
            listBodiesContainer.gameObject.SetActive(false);
            
            btnSubTabHats.interactable = false; 
            btnSubTabBodies.interactable = true;
        }

        public void OpenSubTabBodies()
        {
            listHatsContainer.gameObject.SetActive(false);
            listBodiesContainer.gameObject.SetActive(true);
            
            btnSubTabHats.interactable = true;
            btnSubTabBodies.interactable = false;
        }

        // ==========================================
        // 3. LOGIC XỬ LÝ KHI CLICK VÀO ITEM
        // ==========================================
        private void OnItemClicked(ShopItemSO item, bool isOwned)
        {
            currentlySelectedItem = item;

            txtSelectedName.text = item.itemName;
            btnBuy.gameObject.SetActive(true); 
            
            if (isOwned)
            {
                txtSelectedPrice.text = "Owned";
                txtSelectedPrice.color = Color.green;
                txtBtnBuy.text = "EQUIP";
                
                btnBuy.onClick.RemoveAllListeners();
                btnBuy.onClick.AddListener(EquipCurrentItem);
            }
            else
            {
                txtSelectedPrice.text = item.price.ToString();
                txtSelectedPrice.color = Color.white;
                txtBtnBuy.text = "BUY";
                
                btnBuy.onClick.RemoveAllListeners();
                btnBuy.onClick.AddListener(BuyCurrentItem);
            }

            if (item.GetItemType() == ItemType.COSMETIC)
            {
                characterPreviewer.PreviewCosmetic((CosmeticSO)item);
            }
        }

        private void ClearSelection()
        {
            txtSelectedName.text = "Select an item";
            txtSelectedPrice.text = "---";
            txtSelectedPrice.color = Color.white;
            btnBuy.gameObject.SetActive(false); 
        }

        public void MarkItemAsOwned(string prefabId)
        {
            if (!ownedItemIds.Contains(prefabId))
            {
                ownedItemIds.Add(prefabId);
            }

            PopulateShop(); 

            if (_lastLoadedPerks != null)
            {
                PopulatePerks(_lastLoadedPerks, ownedItemIds);
            }

            if (currentlySelectedItem != null && currentlySelectedItem.prefabId == prefabId)
            {
                OnItemClicked(currentlySelectedItem, true);
            }
            
            if (selectedPerk != null && selectedPerk.prefabId == prefabId)
            {
                OnPerkClicked(selectedPerk, true);
            }
        }

        private void BuyCurrentItem()
        {
            Debug.Log("👉 ĐÃ BẤM VÀO NÚT BUY! Đang chuẩn bị gọi Controller...");
            OnBuyItemRequest?.Invoke(currentlySelectedItem);
        }

        public void UpdateCoinUI(int amount)
        {
            if (txtCoinCount != null)
            {
                txtCoinCount.text = amount.ToString("N0"); 
            }
        }

        private void EquipCurrentItem()
        {
            string headId = null; 
            string bodyId = null;

            CosmeticSO cosmetic = currentlySelectedItem as CosmeticSO;
            if (cosmetic != null)
            {
                if (cosmetic.cosmeticType == CosmeticType.Hat) headId = cosmetic.prefabId;
                else if (cosmetic.cosmeticType == CosmeticType.Body) bodyId = cosmetic.prefabId;
            }

            OnEquipItemRequest?.Invoke(headId, bodyId);
        }

        // ==========================================
        // 4. LOGIC PERK SHOP
        // ==========================================
        public void PopulatePerks(List<PerkSO> perks, List<string> ownedPerkIds)
        {
            _lastLoadedPerks = perks; 
            this.ownedItemIds = ownedPerkIds; 

            foreach (Transform child in perkGridContainer) Destroy(child.gameObject);

            // Tự động ẩn bảng chi tiết khi nạp danh sách mới (chưa ai chọn gì)
            if (grpPerkRightPanel != null) grpPerkRightPanel.SetActive(false);

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

        private void OnPerkClicked(PerkSO perk, bool isOwned)
        {
            selectedPerk = perk;

            // HIỆN BẢNG CHI TIẾT KHI CLICK
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
        public void SwitchTab(int tabIndex)
        {
            ShopTab selectedTab = (ShopTab)tabIndex;

            // 1. Bật/Tắt cụm UI chính
            grpSkinTab.SetActive(selectedTab == ShopTab.Skins);
            grpPerkTab.SetActive(selectedTab == ShopTab.Perks);

            // 2. Quản lý nhân vật 3D: Chỉ hiện khi ở tab Skin
            if (characterPreviewer != null)
            {
                characterPreviewer.gameObject.SetActive(selectedTab == ShopTab.Skins);
            }

            // 3. Đổi trạng thái nút (Interactable) để người chơi biết đang ở tab nào
            btnTabSkins.interactable = (selectedTab != ShopTab.Skins);
            btnTabPerks.interactable = (selectedTab != ShopTab.Perks);

            // 4. Reset các lựa chọn cũ để tránh rác giao diện
            ClearSelection(); // Xóa bên Skin
            if (grpPerkRightPanel != null) grpPerkRightPanel.SetActive(false); // Ẩn bên Perk
        }
    }
}