using System;
using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using GhostVillage.Shop;
using VContainer;
using VContainer.Unity;
using UnityEngine;
using Game.Core.Scene;
using GhostVillage.Domain.Profile;

namespace GhostVillage.Storage
{
    public class StorageController : IInitializable, IDisposable
    {
        private readonly StorageService _storageService;
        private readonly StorageManager _view;
        private readonly ItemDatabaseSO _database;
        private FullProfileDTO _currentData;
        private readonly SceneLoaderService _sceneLoader;
        private bool _isDisposed;

        [Inject]
        public StorageController(StorageService storageService, StorageManager view, ItemDatabaseSO database, SceneLoaderService sceneLoader)
        {
            _storageService = storageService;
            _view = view;
            _database = database;
            _sceneLoader = sceneLoader;
        }

        public void Initialize()
        {
            _view.OnEquipPerkRequested += HandleEquipPerks;
            _view.OnBackRequested += HandleBackToMenu;
            RefreshData().Forget();
        }

        private void HandleBackToMenu()
        {
            Debug.Log("[Storage] Đang quay về MainMenu...");
            _sceneLoader.LoadSceneAsync("MainMenu").Forget();
        }

        private async UniTaskVoid RefreshData()
        {
            if (_isDisposed) return;

            Debug.Log("<color=yellow>[Storage]</color> Đang gọi API lấy Profile...");
            _currentData = await _storageService.GetFullStorageDataAsync();

            if (_currentData == null) {
                Debug.LogError("<color=red>[Storage]</color> API trả về NULL!");
                return;
            }

            // KIỂM TRA DỮ LIỆU THÔ
            Debug.Log($"<color=cyan>[Storage]</color> Server trả về: {(_currentData.storage.unlockedPerks?.Count ?? 0)} Perks sở hữu.");
            if (_currentData.storage.unlockedPerks != null)
            {
                foreach(var id in _currentData.storage.unlockedPerks) Debug.Log($"   -> ID sở hữu: {id}");
            }

            // Mapping Perk: ID -> PerkSO
            List<PerkSO> ownedPerks = new List<PerkSO>();
            foreach (var id in _currentData.storage.unlockedPerks)
            {
                var so = _database.GetItemById(id) as PerkSO;
                if (so != null) 
                {
                    ownedPerks.Add(so);
                    Debug.Log($"<color=green>[Storage]</color> Khớp thành công SO cho ID: {id}");
                }
                else 
                {
                    Debug.LogWarning($"<color=orange>[Storage]</color> KHÔNG tìm thấy ScriptableObject nào có prefabId là: '{id}'");
                }
            }

            _view.SetupPerkUI(_currentData.profile.level, ownedPerks, _currentData.equipped.perks, _database);
        }

        private async void HandleEquipPerks(List<string> newPerkList)
        {
            Debug.Log($"[Storage] Đang gửi yêu cầu trang bị...");
            var result = await _storageService.EquipPerksAsync(newPerkList);
            
            if (result != null)
            {
                Debug.Log("<color=green>[Storage]</color> Lưu thành công!");
                _currentData.equipped.perks = result;
            }
            else 
            {
                // NẾU LỖI: Buộc phải nạp lại dữ liệu từ Server để đồng bộ lại list trong Manager
                Debug.LogError("<color=red>[Storage]</color> Cập nhật thất bại. Đang đồng bộ lại dữ liệu...");
            }
            
            // Luôn gọi RefreshData dù thành công hay thất bại để đảm bảo UI khớp với Server
            RefreshData().Forget();
        }

        public void Dispose()
        {
            _isDisposed = true;
            if (_view != null)
            {
                _view.OnEquipPerkRequested -= HandleEquipPerks;
                _view.OnBackRequested -= HandleBackToMenu;
            }
        }
    }
}