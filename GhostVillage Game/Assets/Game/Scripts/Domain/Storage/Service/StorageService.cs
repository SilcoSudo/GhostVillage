using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using UnityEngine;
using System.Collections.Generic;

namespace GhostVillage.Storage
{
    public class StorageService
    {
        private readonly APIClient _apiClient;

        public StorageService(APIClient apiClient)
        {
            _apiClient = apiClient;
        }

        private string GetToken() => PlayerPrefs.GetString("AccessToken", "");

        public async UniTask<FullProfileDTO> GetFullStorageDataAsync()
        {
            return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player", GetToken());
        }

        public async UniTask<List<string>> EquipPerksAsync(List<string> perkIds)
        {
            var body = new EquipPerkRequest { perks = perkIds };
            string json = JsonUtility.ToJson(body);
            return await _apiClient.PutAsyncWithAuth<List<string>>("/api/game/player/equip-perk", json, GetToken());
        }
    }
}