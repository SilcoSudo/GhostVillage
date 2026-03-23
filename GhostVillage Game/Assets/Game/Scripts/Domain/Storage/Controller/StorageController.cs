using System;
using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using GhostVillage.Shop;
using VContainer;
using VContainer.Unity;
using UnityEngine;

namespace GhostVillage.Storage
{
    public class StorageController : IInitializable, IDisposable
    {
        private readonly StorageService _storageService;
        private readonly StorageManager _view;
        private readonly ItemDatabaseSO _database;
        private FullProfileDTO _currentData;
        private bool _isDisposed;

        [Inject]
        public StorageController(StorageService storageService, StorageManager view, ItemDatabaseSO database)
        {
            _storageService = storageService;
            _view = view;
            _database = database;
        }

        public void Initialize()
        {
            _view.OnEquipPerkRequested += HandleEquipPerks;
            RefreshData().Forget();
        }

        private async UniTaskVoid RefreshData()
        {
            if (_isDisposed) return;

            _currentData = await _storageService.GetFullStorageDataAsync();
            if (_currentData == null) return;

            // Mapping Perk: ID -> PerkSO
            List<PerkSO> ownedPerks = new List<PerkSO>();
            foreach (var id in _currentData.storage.unlockedPerks)
            {
                var so = _database.GetItemById(id) as PerkSO;
                if (so != null) ownedPerks.Add(so);
            }

            // Cập nhật UI Perk
            _view.SetupPerkUI(
                _currentData.profile.level, 
                ownedPerks, 
                _currentData.equipped.perks, 
                _database
            );
        }

        private async void HandleEquipPerks(List<string> newPerkList)
        {
            var result = await _storageService.EquipPerksAsync(newPerkList);
            if (result != null)
            {
                _currentData.equipped.perks = result;
                RefreshData().Forget();
            }
        }

        public void Dispose()
        {
            _isDisposed = true;
            if (_view != null)
            {
                _view.OnEquipPerkRequested -= HandleEquipPerks;
            }
        }
    }
}