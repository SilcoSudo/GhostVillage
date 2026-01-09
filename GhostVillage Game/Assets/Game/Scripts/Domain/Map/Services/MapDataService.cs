using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using UnityEngine;

namespace Game.Domain.Maps
{
    public interface IMapDataService
    {
        UniTask<MapConfigDTO> GetMapConfig(string mapId);
    }

    public class MapDataService : IMapDataService
    {
        private readonly APIClient _apiClient;

        // VContainer tự động tiêm APIClient vào đây
        public MapDataService(APIClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async UniTask<MapConfigDTO> GetMapConfig(string mapId)
        {
            // Gọi API Node.js: GET /api/maps/map_01_jungle/config
            var response = await _apiClient.GetAsync<MapConfigDTO>($"/api/maps/{mapId}/config");

            if (response != null)
            {
                Debug.Log($"✅ Load Config Map [{response.name}] thành công!");
                return response;
            }

            Debug.LogError("❌ Load Map Config thất bại!");
            return null;
        }
    }
}