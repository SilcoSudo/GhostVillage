using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using UnityEngine;
using System.Collections.Generic;
using GhostVillage.Domain.Profile;

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
            
            var response = await _apiClient.PutAsyncWithAuth<EquipPerkResponse>("/api/game/player/equip-perk", json, GetToken());
            
            if (response != null && response.success)
            {
                return response.data;
            }
            return null;
        }
    }
}