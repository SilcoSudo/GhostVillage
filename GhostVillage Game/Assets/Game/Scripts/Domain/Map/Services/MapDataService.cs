using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace Game.Domain.Map.Services
{
    public interface IMapDataService
    {
        UniTask<List<MapConfigDTO>> FetchAllMaps();
    }

    public class MapDataService : IMapDataService
    {
        private readonly APIClient _apiClient;

        public MapDataService(APIClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async UniTask<List<MapConfigDTO>> FetchAllMaps()
        {
            // Endpoint GET /api/maps trả về { success: true, data: [MapConfigDTO] }
            // APIClient của bạn đã có ResponseWrapper xử lý List<T>
            var response = await _apiClient.GetAsync<List<MapConfigDTO>>("/api/maps");

            if (response != null && response.Count > 0)
            {
                Debug.Log($"✅ Đã tải thành công {response.Count} Maps Config!");
                return response;
            }

            Debug.LogError("❌ Không thể lấy dữ liệu Maps từ Server!");
            return null;
        }
    }
}