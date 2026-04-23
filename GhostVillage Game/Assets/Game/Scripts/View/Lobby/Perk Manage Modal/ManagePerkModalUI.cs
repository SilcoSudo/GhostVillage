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
                float maxStam = 1f, stamRegen = 1f, sprintDrain = 1f;
                float battDrain = 1f, vis = 1f, revS = 1f, pres = 0f;
                float postRevSpeed = 0f, postRevDur = 0f;

                var props = new ExitGames.Client.Photon.Hashtable
                {
                    { "Perk_IDs", _tempEquippedPerks.ToArray() }, // Lưu mảng ID để vào game vẽ UI
                    { "P_AutoRev_Count", 0 },     // Xóa trí nhớ Spectral Reflex
                    { "P_AutoRev_Delay", 0f },
                    { "P_AutoRev_Stam", 0f },
                    { "P_Ances_Speed", 0f },      // Xóa trí nhớ Ancestral Vow
                    { "P_Ances_Save", 0f },
                    { "P_Ances_Max", 0 },
                    { "P_Reveal_Dur", 0f },       // Xóa trí nhớ Prophetic Sight
                    { "P_Reveal_Out", false }
                };

                // Nhét toàn bộ vào Balo Photon của LocalPlayer
                // 3. CỘNG DỒN CHỈ SỐ TỪ CÁC PERK ĐANG MẶC TRÊN NGƯỜI
                foreach (var perkId in _tempEquippedPerks)
                {
                    var perkDetail = _currentData.unlockedPerksDetails.Find(p => p.perkId == perkId);
                    if (perkDetail?.modifiers == null) continue;
                    var mod = perkDetail.modifiers;

                    // Nhóm nhân/cộng dồn
                    if (mod.maxStaminaMult > 0) maxStam *= mod.maxStaminaMult;
                    if (mod.staminaRegenMult > 0) stamRegen *= mod.staminaRegenMult;
                    if (mod.sprintStaminaDrainMult > 0) sprintDrain *= mod.sprintStaminaDrainMult;
                    if (mod.batteryDrainMult > 0) battDrain *= mod.batteryDrainMult;
                    if (mod.bossDetectionRangeMult > 0) vis *= mod.bossDetectionRangeMult;
                    if (mod.reviveSpeedMult > 0) revS *= mod.reviveSpeedMult;
                    if (mod.postReviveSpeedBoost > 0) postRevSpeed += mod.postReviveSpeedBoost;
                    if (mod.boostDuration > 0) postRevDur = mod.boostDuration;
                    if (mod.preserveItemChance > 0) pres += mod.preserveItemChance;

                    // Nhóm kỹ năng kích hoạt (Chỉ lấy khi có mang Perk)
                    if (mod.autoReviveCount > 0)
                    {
                        props["P_AutoRev_Count"] = mod.autoReviveCount;
                        props["P_AutoRev_Delay"] = mod.reviveDelay;
                        props["P_AutoRev_Stam"] = mod.reviveStaminaPercent;
                    }
                    if (mod.maxStacks > 0)
                    {
                        props["P_Ances_Speed"] = mod.speedBoostPerDeath;
                        props["P_Ances_Save"] = mod.staminaSavePerDeath;
                        props["P_Ances_Max"] = mod.maxStacks;
                    }
                    if (mod.revealDuration > 0)
                    {
                        props["P_Reveal_Dur"] = mod.revealDuration;
                        props["P_Reveal_Out"] = mod.revealOutline;
                    }
                }

                // 4. GÓI GỌN VÀO TÚI ĐỒ MẠNG (PHOTON)
                props["P_MaxStam"] = maxStam;
                props["P_StamRegen"] = stamRegen;
                props["P_SprintDrain"] = sprintDrain;
                props["P_BattDrain"] = battDrain;
                props["P_Vis"] = vis;
                props["P_RevSpeed"] = revS;
                props["P_Preserve"] = pres;
                props["P_PostRev_Speed"] = postRevSpeed;
                props["P_PostRev_Dur"] = postRevDur;

                PhotonNetwork.LocalPlayer.SetCustomProperties(props);

                Debug.Log("<color=cyan>[Lobby]</color> Đã nạp thành công 9 chỉ số Perk vào Photon CustomProperties!");

                // Đóng bảng
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