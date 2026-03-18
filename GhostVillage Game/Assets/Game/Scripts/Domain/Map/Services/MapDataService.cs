using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using Game.Core.Network;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;
using UnityEngine;
using System;

namespace Game.Domain.Map.Services
{
    public interface IMapDataService
    {
        UniTask<List<MapConfigDTO>> FetchAllMaps();
        UniTask<AggregatedGameDataDTO> FetchGameData(string mapId);
    }

    public class MapDataService : IMapDataService
    {
        private readonly APIClient _apiClient;
        private readonly GameSession _session;

        public MapDataService(APIClient apiClient, GameSession session)
        {
            _apiClient = apiClient;
            _session = session;
        }

        // LỚP BỌC CỤ THỂ KHÔNG DÙNG GENERIC ĐỂ JSONUTILITY ĐỌC ĐƯỢC MẢNG
        [Serializable]
        private class MapListResponse
        {
            public bool success;
            public List<MapConfigDTO> data;
        }

        public async UniTask<List<MapConfigDTO>> FetchAllMaps()
        {
            // Gọi lấy Raw JSON thay vì dùng hàm Generic bị lỗi
            string jsonResponse = await _apiClient.GetRawJsonWithAuth("/api/maps", _session.Token);

            if (!string.IsNullOrEmpty(jsonResponse))
            {
                try
                {
                    var response = JsonUtility.FromJson<MapListResponse>(jsonResponse);
                    if (response != null && response.success && response.data != null)
                    {
                        Debug.Log($"✅ Đã tải thành công {response.data.Count} Maps từ Server!");
                        return response.data;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"❌ Lỗi Parse JSON Map List: {e.Message}");
                }
            }

            Debug.LogError("❌ Không thể lấy dữ liệu Maps từ Server!");
            return new List<MapConfigDTO>(); // Trả về list rỗng để tránh Null Exception
        }

        public async UniTask<AggregatedGameDataDTO> FetchGameData(string mapId)
        {
            var response = await _apiClient.GetAsyncWithAuth<AggregatedGameDataDTO>($"/api/maps/{mapId}/game-data", _session.Token);

            if (response != null && response.mapConfig != null)
            {
                Debug.Log($"✅ Đã tải thành công Mega Game Data cho Map: {response.mapConfig.identityConfig.displayName}!");
                return response;
            }

            Debug.LogError($"❌ Không thể lấy Mega Game Data cho Map {mapId}!");
            return null;
        }
    }
}