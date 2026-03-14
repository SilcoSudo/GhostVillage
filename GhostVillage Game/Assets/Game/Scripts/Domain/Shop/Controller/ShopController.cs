using System;
using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using VContainer.Unity;
using GhostVillage.Domain.Profile;
using System.Collections.Generic;

namespace GhostVillage.Shop
{
    public class ShopController : IInitializable, IDisposable
    {
        private readonly ShopService _shopService;
        private readonly ShopManager _view;
        private readonly ItemDatabaseSO _database; // Inject Database vào đây
        private bool _isDisposed;

        [Inject]
        public ShopController(ShopService shopService, ShopManager view, ItemDatabaseSO database)
        {
            _shopService = shopService;
            _view = view;
            _database = database;
        }

        public void Initialize()
        {
            Debug.Log("<color=cyan>[ShopController]</color> Khởi tạo hệ thống Shop với Database SO...");

            // 1. Đăng ký sự kiện
            _view.OnBuyItemRequest += HandleBuyItem;       // Mua Skin (Dùng ShopItemSO)
            _view.OnEquipItemRequest += HandleEquipItem;   // Mặc đồ
            _view.OnBuyPerkRequest += HandleBuyPerk;       // Mua Perk (Dùng PerkSO)
            _view.btnTabSkins.onClick.AddListener(() => _view.SwitchTab(0));
            _view.btnTabPerks.onClick.AddListener(() => _view.SwitchTab(1));
            // 2. Nạp dữ liệu ban đầu
            LoadInitialData().Forget();
        }

        private async UniTaskVoid LoadInitialData()
        {
            // Tải song song Shop và Profile
            await UniTask.WhenAll(
                LoadShopPoolAndTimerAsync(),
                LoadPlayerStateAsync()
            );
        }

        // ==========================================
        // 1. LOGIC MAPPING ID -> SCRIPTABLE OBJECT
        // ==========================================

        private async UniTask LoadShopPoolAndTimerAsync()
        {
            var shopData = await _shopService.FetchShopDataAsync();
            var profile = await _shopService.FetchPlayerProfileAsync();

            if (shopData != null)
            {
                List<PerkSO> perksToDisplay = new List<PerkSO>();
                foreach (var dto in shopData.perks)
                {
                    var so = _database.GetItemById(dto.prefabId) as PerkSO;
                    if (so != null) perksToDisplay.Add(so);
                    else Debug.LogWarning($"[Shop] Thiếu SO cho ID: {dto.prefabId}");
                }

                // Gọi View với danh sách SO (Khớp với Manager đã sửa ở trên)
                _view.PopulatePerks(perksToDisplay, profile?.storage.unlockedPerks ?? new List<string>());

                if (!string.IsNullOrEmpty(shopData.expiresAt))
                {
                    UpdateResetTimer(shopData.expiresAt).Forget();
                }
            }
        }

        private async UniTask LoadPlayerStateAsync()
        {
            var profile = await _shopService.FetchPlayerProfileAsync();
            if (profile != null)
            {
                _view.ownedItemIds = profile.storage.unlockedSkins;
                // Đồng bộ cả Perk vào list owned chung để check isOwned
                _view.ownedItemIds.AddRange(profile.storage.unlockedPerks);

                _view.PopulateShop();
                Debug.Log($"[ShopController] Đã đồng bộ {profile.storage.unlockedSkins.Count} Skins và {profile.storage.unlockedPerks.Count} Perks.");
            }
        }

        // ==========================================
        // 2. XỬ LÝ GIAO DỊCH DÙNG INTERFACE
        // ==========================================

        private async void HandleBuyItem(ShopItemSO item)
        {
            if (item == null) return;
            await ExecutePurchase(item, "COSMETIC");
        }

        private async void HandleBuyPerk(PerkSO perk)
        {
            if (perk == null) return;
            await ExecutePurchase(perk, "PERK");
        }

        // Hàm mua dùng chung (Generic Purchase Logic)
        private async UniTask ExecutePurchase(IShopItem item, string backendType)
        {
            try 
            {
                Debug.Log($"[ShopController] Đang mua {backendType}: {item.GetName()}");
                var result = await _shopService.BuyItemAsync(item.GetId(), backendType);

                if (result != null)
                {
                    Debug.Log($"<color=green>[Success]</color> Mua thành công! Số dư: {result.newBalance}");
                    _view.MarkItemAsOwned(item.GetId());
                }
            }
            catch (Exception ex)
            {
                // Xử lý lỗi 400 (Already Owned) hoặc 402 (Hết tiền)
                if (ex.Message.Contains("already own"))
                {
                    _view.MarkItemAsOwned(item.GetId());
                }
                Debug.LogError($"[ShopController] Lỗi giao dịch: {ex.Message}");
            }
        }

        private async void HandleEquipItem(string headId, string bodyId)
        {
            var result = await _shopService.EquipSkinAsync(headId, bodyId);
            if (result != null) Debug.Log("<color=yellow>[Shop]</color> Đã thay đổi trang bị.");
        }

        // ==========================================
        // 3. TIMER & DISPOSE
        // ==========================================

        private async UniTaskVoid UpdateResetTimer(string expiresAtStr)
        {
            // 1. Parse thời gian từ chuỗi ISO của Server
            if (!DateTime.TryParse(expiresAtStr, out DateTime expiresAt)) {
                Debug.LogError($"[Timer] Không thể parse thời gian: {expiresAtStr}");
                return;
            }

            // Chuyển về giờ máy khách
            DateTime endDateTime = expiresAt.ToLocalTime();

            while (!_isDisposed)
            {
                TimeSpan remaining = endDateTime - DateTime.Now;

                if (remaining.TotalSeconds <= 0)
                {
                    _view.txtResetTimer.text = "Cửa hàng đang làm mới...";
                    break;
                }

                // 2. Format theo yêu cầu: Ngày, Giờ, Phút
                _view.txtResetTimer.text = string.Format("Reset after: {0} days {1:D2} hours {2:D2} minutes", 
                                            remaining.Days, 
                                            remaining.Hours, 
                                            remaining.Minutes);

                // Cập nhật mỗi 1 phút một lần
                await UniTask.Delay(60000); 
            }
        }

        public void Dispose()
        {
            _isDisposed = true;
            if (_view != null)
            {
                _view.OnBuyItemRequest -= HandleBuyItem;
                _view.OnEquipItemRequest -= HandleEquipItem;
                _view.OnBuyPerkRequest -= HandleBuyPerk;
            }
        }
    }
}