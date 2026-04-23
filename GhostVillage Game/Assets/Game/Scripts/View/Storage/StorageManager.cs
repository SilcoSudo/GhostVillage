using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using GhostVillage.Shop;

// Xin chào bạn!

namespace GhostVillage.Storage
{
    public class StorageManager : MonoBehaviour
    {
        public Action<List<string>> OnEquipPerkRequested;

        [Header("--- NAVIGATION ---")]
        public Button btnBack;
        public Action OnBackRequested;

        [Header("--- PERK INVENTORY ---")]
        public Transform gridOwnedPerks;
        public GameObject slotPrefab;

        [Header("--- EQUIPPED SLOTS ---")]
        public EquippedPerkSlotUI[] equippedPerkSlots;

        [Header("--- DETAILS PANEL ---")]
        public Image imgSelectedPerkIcon;
        public TextMeshProUGUI txtSelectedPerkName, txtSelectedPerkDesc;
        public Button btnEquipPerk;
        public TextMeshProUGUI txtBtnEquipPerk;

        private PerkSO _selectedPerk;
        private List<string> _currentEquippedPerks = new List<string>();
        private int _playerLevel;
        private int _maxPerkSlots;

        // [MỚI] Lưu lại data để tí nữa giật UI (Refresh) không bị mất
        private List<PerkSO> _cachedOwnedPerks;
        private ItemDatabaseSO _cachedItemDB;

        private void Start()
        {
            if (btnBack != null)
            {
                btnBack.onClick.AddListener(() => OnBackRequested?.Invoke());
            }

            btnEquipPerk.onClick.AddListener(HandlePerkEquipBtn);
            // Ẩn detail mặc định nếu chưa chọn gì
            imgSelectedPerkIcon.gameObject.SetActive(false);
            txtSelectedPerkName.gameObject.SetActive(false);
            txtSelectedPerkDesc.gameObject.SetActive(false);
            btnEquipPerk.gameObject.SetActive(false);
        }

        public void SetupPerkUI(int level, List<PerkSO> ownedPerks, List<string> equippedIds, ItemDatabaseSO db)
        {
            // Cập nhật lại Cache để tái sử dụng
            _playerLevel = level;
            _cachedOwnedPerks = ownedPerks;
            _cachedItemDB = db;

            _currentEquippedPerks = new List<string>(equippedIds);
            _maxPerkSlots = level >= 25 ? 3 : (level >= 10 ? 2 : 1);

            // 1. Cập nhật 3 ô trang bị phía trên (Hệ thống ổ khóa)
            for (int i = 0; i < equippedPerkSlots.Length; i++)
            {
                int slotIdx = i + 1;
                bool locked = (slotIdx == 2 && level < 10) || (slotIdx == 3 && level < 25);
                string msg = locked ? $"Lv.{(slotIdx == 2 ? 10 : 25)}" : "";

                Sprite icon = null;
                string pName = "";

                if (!locked && i < _currentEquippedPerks.Count)
                {
                    string perkIdFromServer = _currentEquippedPerks[i];
                    var perkSO = db.GetItemById(perkIdFromServer) as PerkSO;

                    if (perkSO != null)
                    {
                        icon = perkSO.icon;
                        pName = perkSO.itemName;
                        // Bỏ bớt log đi cho đỡ rác Console lúc Refresh
                        // Debug.Log($"<color=green>[Storage]</color> Slot {i} tìm thấy Perk: {pName}");
                    }
                    else
                    {
                        Debug.LogWarning($"<color=red>[Storage]</color> Slot {i} thất bại! Không tìm thấy ID: '{perkIdFromServer}' trong Database.");
                    }
                }

                // Gọi hàm SetStatus với đầy đủ 4 tham số
                equippedPerkSlots[i].SetStatus(locked, msg, pName, icon);
            }

            // 2. Vẽ danh sách Perk sở hữu ở dưới
            foreach (Transform child in gridOwnedPerks) Destroy(child.gameObject);
            foreach (var perk in ownedPerks)
            {
                var go = Instantiate(slotPrefab, gridOwnedPerks);
                bool isEquipped = _currentEquippedPerks.Contains(perk.prefabId);
                go.GetComponent<StorageSlotUI>().Setup(perk, isEquipped, () => SelectPerk(perk, isEquipped));
            }
        }

        private void SelectPerk(PerkSO perk, bool isEquipped)
        {
            _selectedPerk = perk;
            txtSelectedPerkName.text = perk.itemName;
            txtSelectedPerkDesc.text = perk.description;
            imgSelectedPerkIcon.sprite = perk.icon;
            imgSelectedPerkIcon.gameObject.SetActive(true);
            txtSelectedPerkName.gameObject.SetActive(true);
            txtSelectedPerkDesc.gameObject.SetActive(true);
            btnEquipPerk.gameObject.SetActive(true);

            txtBtnEquipPerk.text = isEquipped ? "UNEQUIP" : "EQUIP";

            // Check giới hạn slot để enable/disable nút Equip
            if (!isEquipped && _currentEquippedPerks.Count >= _maxPerkSlots)
                btnEquipPerk.interactable = false;
            else
                btnEquipPerk.interactable = true;
        }

        private void HandlePerkEquipBtn()
        {
            if (_selectedPerk == null) return;

            bool isCurrentlyEquipped = _currentEquippedPerks.Contains(_selectedPerk.prefabId);

            if (isCurrentlyEquipped)
            {
                // Nếu đang mặc thì cho phép tháo ra thoải mái
                _currentEquippedPerks.Remove(_selectedPerk.prefabId);
            }
            else
            {
                // Nếu đang định mặc thêm, phải kiểm tra xem còn slot trống không
                if (_currentEquippedPerks.Count >= _maxPerkSlots)
                {
                    Debug.LogWarning("Đã hết ô trống kỹ năng!");
                    return;
                }
                _currentEquippedPerks.Add(_selectedPerk.prefabId);
            }

            // [1] HÚ LÊN CHO API BẮN VỀ SERVER (Giữ nguyên của Sếp)
            OnEquipPerkRequested?.Invoke(_currentEquippedPerks);

            // ==========================================
            // [2] GIẬT LẠI UI NGAY LẬP TỨC ĐỂ HIỂN THỊ ĐÚNG TRẠNG THÁI
            // ==========================================
            if (_cachedOwnedPerks != null && _cachedItemDB != null)
            {
                // Gọi lại SetupPerkUI để vẽ lại mấy cái Slot ở trên và list ở dưới
                SetupPerkUI(_playerLevel, _cachedOwnedPerks, _currentEquippedPerks, _cachedItemDB);

                // Vẽ lại cái nút bên phải để đổi chữ EQUIP -> UNEQUIP
                bool newEquippedState = _currentEquippedPerks.Contains(_selectedPerk.prefabId);
                SelectPerk(_selectedPerk, newEquippedState);
            }
        }
    }
}