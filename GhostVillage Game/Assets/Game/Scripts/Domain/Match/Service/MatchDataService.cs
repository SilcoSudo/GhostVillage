using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using Game.Domain.Match.DTO;
using UnityEngine;
using VContainer;

namespace Game.Domain.Match.Services
{
    public class MatchDataService
    {
        private readonly APIClient _apiClient;

        // Constructor Injection
        public MatchDataService(APIClient apiClient)
        {
            _apiClient = apiClient;
        }

        public async UniTask ReportMatchResultAsync(SaveMatchRequestDTO requestData)
        {
            Debug.Log($"[MatchService] Đang gửi báo cáo trận đấu: {requestData.sessionId}...");

            try
            {
                string jsonBody = JsonUtility.ToJson(requestData);

                // [FIX] Gọi API và hứng DTO mới
                var response = await _apiClient.PostAsync<SaveMatchResponseDTO>("/api/matches", jsonBody);

                // [FIX] Logic check thành công:
                // Vì APIClient chỉ trả về data khi success = true, nên nếu response != null nghĩa là OK.
                if (response != null && !string.IsNullOrEmpty(response._id))
                {
                    Debug.Log($"✅ [MatchService] Lưu kết quả thành công! Match ID: {response._id}");
                }
                else
                {
                    // Trường hợp này hiếm khi xảy ra nếu APIClient chạy đúng
                    Debug.LogError($"❌ [MatchService] Có lỗi (Response null)");
                }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"❌ [MatchService] Exception: {ex.Message}");
            }
        }
    }
}