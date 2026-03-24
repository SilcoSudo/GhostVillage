using System;
using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using VContainer.Unity;
using System.Collections.Generic;
using Game.Core.Scene;

namespace GhostVillage.Shop
{
    public class ShopController : IInitializable, IDisposable
    {
        private readonly ShopService _shopService;
        private readonly ShopManager _view;
        private readonly ItemDatabaseSO _database;
        private readonly SceneLoaderService _sceneLoader;
        private bool _isDisposed;

        [Inject]
        public ShopController(ShopService shopService, ShopManager view, ItemDatabaseSO database, SceneLoaderService sceneLoader)
        {
            _shopService = shopService;
            _view = view;
            _database = database;
            _sceneLoader = sceneLoader;
        }

        public void Initialize()
        {
            Debug.Log("<color=cyan>[ShopController]</color> Khởi tạo hệ thống Perk Shop...");

            // 1. Đăng ký sự kiện duy nhất: Mua Perk
            _view.OnBuyPerkRequest += HandleBuyPerk;
            _view.OnBackRequested += HandleBackToMenu;

            // 2. Nạp dữ liệu ban đầu
            LoadInitialData().Forget();
        }

        private void HandleBackToMenu()
        {
            Debug.Log("[Shop] Trở về MainMenu...");
            _sceneLoader.LoadSceneAsync("MainMenu").Forget(); 
        }

        private async UniTaskVoid LoadInitialData()
        {
            // Tải song song dữ liệu Shop và Profile người chơi
            await UniTask.WhenAll(
                LoadShopPoolAsync(),
                LoadPlayerStateAsync()
            );
        }

        private async UniTask LoadShopPoolAsync()
        {
            var shopData = await _shopService.FetchShopDataAsync();
            var profile = await _shopService.FetchPlayerProfileAsync();

            if (shopData != null)
            {
                // Mapping DTO từ Server sang ScriptableObject của Unity
                List<PerkSO> perksToDisplay = new List<PerkSO>();
                foreach (var dto in shopData.perks)
                {
                    var so = _database.GetItemById(dto.prefabId) as PerkSO;
                    if (so != null) perksToDisplay.Add(so);
                    else Debug.LogWarning($"[Shop] Thiếu ScriptableObject cho ID: {dto.prefabId}");
                }

                // Hiển thị danh sách Perk lên UI
                _view.PopulatePerks(perksToDisplay, profile?.storage.unlockedPerks ?? new List<string>());

                // Cập nhật Timer nếu có
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
                _view.ownedItemIds = profile.storage.unlockedPerks; 
                
                _view.UpdateCoinUI(profile.profile.coin);
                Debug.Log($"[ShopController] Đã đồng bộ {profile.storage.unlockedPerks.Count} Perks sở hữu.");
            }
        }

        private async void HandleBuyPerk(PerkSO perk)
        {
            if (perk == null || _isDisposed) return;

            try 
            {
                Debug.Log($"[ShopController] Đang tiến hành mua Perk: {perk.itemName}");
                var result = await _shopService.BuyItemAsync(perk.prefabId, "PERK");

                if (result != null)
                {
                    Debug.Log($"<color=green>[Success]</color> Mua thành công! Số dư mới: {result.newBalance}");
                    _view.MarkItemAsOwned(perk.prefabId);
                    _view.UpdateCoinUI(result.newBalance);
                }
            }
            catch (Exception ex)
            {
                // Xử lý các lỗi phổ biến (Hết tiền, đã sở hữu...)
                if (ex.Message.Contains("already own"))
                {
                    _view.MarkItemAsOwned(perk.prefabId);
                }
                Debug.LogError($"[ShopController] Lỗi mua Perk: {ex.Message}");
            }
        }

        private async UniTaskVoid UpdateResetTimer(string expiresAtStr)
        {
            if (!DateTime.TryParse(expiresAtStr, out DateTime expiresAt)) return;
            DateTime endDateTime = expiresAt.ToLocalTime();

            while (!_isDisposed)
            {
                TimeSpan remaining = endDateTime - DateTime.Now;
                if (remaining.TotalSeconds <= 0)
                {
                    if (_view.txtResetTimer != null) _view.txtResetTimer.text = "Shop is refreshing...";
                    break;
                }

                if (_view.txtResetTimer != null)
                {
                    _view.txtResetTimer.text = string.Format("Reset after: {0}d {1:D2}h {2:D2}m", 
                        remaining.Days, remaining.Hours, remaining.Minutes);
                }

                await UniTask.Delay(60000); // Cập nhật mỗi phút
            }
        }

        public void Dispose()
        {
            _isDisposed = true;
            if (_view != null)
            {
                _view.OnBuyPerkRequest -= HandleBuyPerk;
                _view.OnBackRequested -= HandleBackToMenu;
            }
        }
    }
}