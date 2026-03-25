using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using Game.Core.Network.API;
using GhostVillage.Domain.Profile;

namespace GhostVillage.Shop
{
    public class ShopService
    {
        private readonly APIClient _apiClient;

        [Inject]
        public ShopService(APIClient apiClient)
        {
            _apiClient = apiClient;
        }

        private string GetToken() => PlayerPrefs.GetString("AccessToken", "");

        public async UniTask<ShopDataDTO> FetchShopDataAsync() {
            return await _apiClient.GetAsyncWithAuth<ShopDataDTO>("/api/game/shop", GetToken());
        }

        public async UniTask<BuyDataDTO> BuyItemAsync(string itemId, string itemType) {
            var requestObj = new BuyRequestDTO { itemId = itemId, itemType = itemType };
            string jsonBody = JsonUtility.ToJson(requestObj);
            return await _apiClient.PostAsyncWithAuth<BuyDataDTO>("/api/game/shop/buy", jsonBody, GetToken());
        }

        public async UniTask<FullProfileDTO> FetchPlayerProfileAsync() {
            return await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player", GetToken());
        }
    }
}