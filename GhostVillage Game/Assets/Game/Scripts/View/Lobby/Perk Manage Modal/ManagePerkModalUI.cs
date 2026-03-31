using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using Game.Domain.Perk.Controllers;
using Game.Domain.Perk.DTOs;
using GhostVillage.Shop;
using Photon.Pun; // Chứa ItemDatabaseSO của sếp

namespace Game.Scripts.UI.Lobby
{
    public class ManagePerkModalUI : MonoBehaviour
    {
        [Header("--- TRÁI: DANH SÁCH PERK SỞ HỮU ---")]
        [SerializeField] private Transform _trfOwnedPerksContent;
        [SerializeField] private GameObject _prefabPerkSlot;

        [Tooltip("Kéo ItemDatabaseSO vào đây để móc Icon ra")]
        [SerializeField] private ItemDatabaseSO _itemDatabase;

        [Header("--- PHẢI TRÊN: EQUIPPED SLOTS ---")]
        [SerializeField] private Image[] _imgEquippedSlots; // Kéo 3 cái Img_Slot1, 2, 3 vào đây
        [SerializeField] private Button[] _btnEquippedSlots; // Bổ sung mảng Nút này

        [Header("--- PHẢI DƯỚI: PERK INFO ---")]
        [SerializeField] private TextMeshProUGUI _txtPerkDesc;
        [SerializeField] private Button _btnEquip;
        [SerializeField] private TextMeshProUGUI _txtBtnEquip;

        [Header("--- NÚT ĐIỀU KHIỂN ---")]
        [SerializeField] private Button _btnSave;
        [SerializeField] private Button _btnClose;

        public Button BtnClose => _btnClose;

        private PerkController _perkController;
        private PlayerPerksData _currentData;
        private List<string> _tempEquippedPerks = new List<string>();
        private PerkDetailDTO _selectedPerk;

        private void Awake()
        {
            _btnEquip.onClick.AddListener(ToggleEquipPerk);
            _btnSave.onClick.AddListener(SavePerksAsync);

            gameObject.SetActive(false);
        }

        public void Init(PerkController perkController)
        {
            _perkController = perkController;
        }

        public async void OpenModal()
        {
            gameObject.SetActive(true);

            // Ẩn mô tả và nút Equip lúc mới bật lên
            _txtPerkDesc.text = "Chọn một kỹ năng bên trái để xem mô tả.";
            _btnEquip.gameObject.SetActive(false);
            _selectedPerk = null;

            if (_perkController != null)
            {
                await _perkController.FetchPerkDataAsync();
                _currentData = _perkController.PerkData.Value;

                if (_currentData != null)
                {
                    _tempEquippedPerks = _currentData.equippedPerks != null ? new List<string>(_currentData.equippedPerks) : new List<string>(); RefreshUI();
                }
            }
        }

        public void CloseModal()
        {
            gameObject.SetActive(false);
        }

        // ==========================================
        // VẼ LẠI GIAO DIỆN
        // ==========================================
        private void RefreshUI()
        {
            if (_currentData == null) return;

            // 1. VẼ 3 Ô TRANG BỊ
            for (int i = 0; i < _imgEquippedSlots.Length; i++)
            {
                bool isSlotLocked = i >= _currentData.maxPerkSlots;
                Image slotImg = _imgEquippedSlots[i];
                Button slotBtn = _btnEquippedSlots[i]; // Lấy cái nút ra

                slotBtn.onClick.RemoveAllListeners(); // Xóa rác cũ

                if (isSlotLocked)
                {
                    slotImg.sprite = null;
                    slotImg.color = new Color(0.2f, 0.2f, 0.2f, 1f);
                    slotBtn.interactable = false; // Khóa thì không cho bấm
                }
                else if (i < _tempEquippedPerks.Count)
                {
                    string perkId = _tempEquippedPerks[i];
                    var perkDetail = _currentData.unlockedPerksDetails.Find(p => p.perkId == perkId);
                    Sprite icon = GetPerkSprite(perkDetail?.prefabId);

                    slotImg.sprite = icon;
                    slotImg.color = Color.white;

                    // Gắn sự kiện: Bấm vào Slot thì gọi hàm soi Chi tiết y chang như bấm bên trái!
                    slotBtn.interactable = true;
                    slotBtn.onClick.AddListener(() => OnPerkSelected(perkDetail));
                }
                else
                {
                    slotImg.sprite = null;
                    slotImg.color = new Color(0.5f, 0.5f, 0.5f, 0.5f);
                    slotBtn.interactable = false; // Trống thì không cho bấm
                }
            }

            // 2. VẼ DANH SÁCH BÊN TRÁI
            foreach (Transform child in _trfOwnedPerksContent) Destroy(child.gameObject);

            foreach (var perk in _currentData.unlockedPerksDetails)
            {
                var go = Instantiate(_prefabPerkSlot, _trfOwnedPerksContent);
                var slotUI = go.GetComponent<PerkSlotItemUI>();

                bool isEquipped = _tempEquippedPerks.Contains(perk.perkId);
                Sprite icon = GetPerkSprite(perk.prefabId);

                slotUI.Setup(perk, isEquipped, icon, OnPerkSelected);

                bool isSelected = (_selectedPerk != null && _selectedPerk.perkId == perk.perkId);
                slotUI.SetSelectedVisual(isSelected);
            }
        }

        // ==========================================
        // XỬ LÝ SỰ KIỆN CLICK VÀO PERK BÊN TRÁI
        // ==========================================
        // XỬ LÝ SỰ KIỆN CLICK VÀO PERK BÊN TRÁI
        private void OnPerkSelected(PerkDetailDTO perk)
        {
            _selectedPerk = perk;

            // Hiện Text
            _txtPerkDesc.text = perk.description;
            _btnEquip.gameObject.SetActive(true);

            RefreshEquipButtonState();

            // ==========================================
            // CẬP NHẬT VISUAL SẬM MÀU CHO LIST BÊN TRÁI
            // ==========================================
            var allSlots = _trfOwnedPerksContent.GetComponentsInChildren<PerkSlotItemUI>();
            foreach (var slot in allSlots)
            {
                // Thằng nào trùng ID với thằng đang chọn thì làm sậm màu
                bool isThisSlotSelected = (slot.GetPerkId() == perk.perkId);
                slot.SetSelectedVisual(isThisSlotSelected);
            }
        }

        private void RefreshEquipButtonState()
        {
            if (_selectedPerk == null) return;

            bool isEquipped = _tempEquippedPerks.Contains(_selectedPerk.perkId);
            _txtBtnEquip.text = isEquipped ? "UNEQUIP" : "EQUIP";

            if (!isEquipped && _tempEquippedPerks.Count >= _currentData.maxPerkSlots)
            {
                _btnEquip.interactable = false; // Hết lỗ cắm
            }
            else
            {
                _btnEquip.interactable = true;
            }
        }

        private void ToggleEquipPerk()
        {
            if (_selectedPerk == null) return;

            bool isEquipped = _tempEquippedPerks.Contains(_selectedPerk.perkId);

            if (isEquipped)
            {
                _tempEquippedPerks.Remove(_selectedPerk.perkId);
            }
            else
            {
                if (_tempEquippedPerks.Count < _currentData.maxPerkSlots)
                {
                    _tempEquippedPerks.Add(_selectedPerk.perkId);
                }
            }

            RefreshUI();
            RefreshEquipButtonState();
        }

        // ==========================================
        // CHỐT ĐƠN VÀ ĐÓNG GÓI CHỈ SỐ MANG VÀO GAME
        // ==========================================
        private async void SavePerksAsync()
        {
            if (_perkController == null) return;

            bool success = await _perkController.SaveEquippedPerksAsync(_tempEquippedPerks);
            if (success)
            {
                Debug.Log("<color=green>Đã lưu Loadout Perk lên Server thành công!</color>");

                // --- BÍ THUẬT: ĐÓNG GÓI CHỈ SỐ GỬI VÀO PHOTON ---
                float maxStaminaMult = 1f;
                float staminaRegenMult = 1f;
                float preserveItemChance = 0f;
                float reviveSpeedMult = 1f;

                // Duyệt qua các Perk đang chọn để cộng dồn Buff
                foreach (var perkId in _tempEquippedPerks)
                {
                    var perkDetail = _currentData.unlockedPerksDetails.Find(p => p.perkId == perkId);
                    if (perkDetail != null && perkDetail.modifiers != null)
                    {
                        var mod = perkDetail.modifiers;

                        // Cộng/Nhân dồn các chỉ số từ DTO của sếp
                        if (mod.maxStaminaMult > 0) maxStaminaMult *= mod.maxStaminaMult;
                        if (mod.staminaRegenMult > 0) staminaRegenMult *= mod.staminaRegenMult;
                        if (mod.preserveItemChance > 0) preserveItemChance += mod.preserveItemChance;
                        if (mod.reviveSpeedMult > 0) reviveSpeedMult *= mod.reviveSpeedMult;
                    }
                }

                // Nhét toàn bộ vào Balo Photon của LocalPlayer
                var props = new ExitGames.Client.Photon.Hashtable
                {
                    { "Perk_IDs", _tempEquippedPerks.ToArray() }, // Giữ lại mảng ID nhỡ vào game cần hiện Icon
                    { "Perk_MaxStamina", maxStaminaMult },
                    { "Perk_StaminaRegen", staminaRegenMult },
                    { "Perk_PreserveItem", preserveItemChance },
                    { "Perk_ReviveSpeed", reviveSpeedMult }
                };
                PhotonNetwork.LocalPlayer.SetCustomProperties(props);
                // ------------------------------------------------

                if (_btnClose != null) _btnClose.onClick.Invoke();
            }
        }

        // MÓC ICON TỪ DATABASE
        private Sprite GetPerkSprite(string prefabId)
        {
            if (string.IsNullOrEmpty(prefabId) || _itemDatabase == null) return null;

            // Lấy item từ DatabaseSO của Sếp
            var itemSO = _itemDatabase.GetItemById(prefabId);

            // Lưu ý: Tùy cách sếp định nghĩa PerkSO kế thừa từ ShopItemSO như thế nào
            // Giả sử ShopItemSO có trường icon, ta xài luôn:
            return itemSO != null ? itemSO.icon : null;
        }
    }
}