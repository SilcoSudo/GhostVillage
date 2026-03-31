using Cysharp.Threading.Tasks;
using UnityEngine;
using VContainer;
using Game.Core.Network.API;
using Game.Domain.Friend.DTOs;
using System.Collections.Generic;
using Game.Core.Network;

namespace Game.Domain.Friend.Services
{
    public class FriendService
    {
        private readonly APIClient _apiClient;
        private readonly GameSession _session; // THAY ĐỔI Ở ĐÂY

        [Inject]
        public FriendService(APIClient apiClient, GameSession session) // THAY ĐỔI Ở ĐÂY
        {
            _apiClient = apiClient;
            _session = session; // THAY ĐỔI Ở ĐÂY
        }

        private string Token => _session.Token;

        // 1. TÌM KIẾM THEO UID
        public async UniTask<PlayerSearchDTO> SearchPlayerAsync(string uid)
        {
            // API nằm bên game/player
            string endpoint = $"/api/game/player/search/{uid}";
            return await _apiClient.GetAsyncWithAuth<PlayerSearchDTO>(endpoint, Token);
        }

        // 2. GỬI LỜI MỜI KẾT BẠN
        // (TRUYỀN VỀ EXCEPTION NẾU CÓ ĐỂ BẮT ERROR MESSAGE)

        // 2. GỬI LỜI MỜI KẾT BẠN
        public async UniTask<bool> AddFriendAsync(string targetUserId)
        {
            string endpoint = "/api/web/friend/add";
            var body = new FriendRequestBody { targetUserId = targetUserId };
            string jsonBody = JsonUtility.ToJson(body);

            // Bỏ try-catch ở đây để quăng lỗi lên Controller xử lý
            var response = await _apiClient.PostAsyncWithAuth<object>(endpoint, jsonBody, Token);
            return response != null;
        }

        public async UniTask<bool> AcceptFriendAsync(string friendshipId)
        {
            string endpoint = "/api/web/friend/accept";
            var body = new FriendRequestBody { friendshipId = friendshipId };
            string jsonBody = JsonUtility.ToJson(body);

            var response = await _apiClient.PostAsyncWithAuth<object>(endpoint, jsonBody, Token);
            return response != null;
        }

        // 4. TỪ CHỐI KẾT BẠN
        public async UniTask<bool> RejectFriendAsync(string friendshipId)
        {
            string endpoint = "/api/web/friend/reject";
            var body = new FriendRequestBody { friendshipId = friendshipId };
            string jsonBody = JsonUtility.ToJson(body);

            var response = await _apiClient.PostAsyncWithAuth<object>(endpoint, jsonBody, Token);
            return response != null;
        }

        // 5. HỦY KẾT BẠN
        public async UniTask<bool> UnfriendAsync(string targetUserId)
        {
            string endpoint = "/api/web/friend/unfriend";
            var body = new FriendRequestBody { targetUserId = targetUserId };
            string jsonBody = JsonUtility.ToJson(body);

            var response = await _apiClient.PostAsyncWithAuth<object>(endpoint, jsonBody, Token);
            return response != null;
        }

        // 6. CÁC HÀM GET DANH SÁCH
        public async UniTask<List<FriendProfileDTO>> GetFriendListAsync()
            => await GetListAsync("/api/web/friend/list");

        public async UniTask<List<FriendProfileDTO>> GetPendingRequestsAsync()
            => await GetListAsync("/api/web/friend/pending-requests");

        public async UniTask<List<FriendProfileDTO>> GetSentRequestsAsync()
            => await GetListAsync("/api/web/friend/sent-requests");

        // Helper method cho việc Parse Json Array
        private async UniTask<List<FriendProfileDTO>> GetListAsync(string endpoint)
        {
            string url = $"{_apiClient.GetType().GetField("_baseUrl", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(_apiClient)}/{endpoint.TrimStart('/')}";

            using var request = UnityEngine.Networking.UnityWebRequest.Get(url);
            request.SetRequestHeader("Authorization", $"Bearer {Token}");

            try
            {
                await request.SendWebRequest();
                string json = request.downloadHandler.text;

                int start = json.IndexOf("\"data\":[");
                if (start == -1) return new List<FriendProfileDTO>();

                int arrayStart = json.IndexOf('[', start);
                int arrayEnd = json.LastIndexOf(']');
                string arrayJson = json.Substring(arrayStart, arrayEnd - arrayStart + 1);

                string wrappedJson = "{\"items\":" + arrayJson + "}";
                var wrapper = JsonUtility.FromJson<FriendListWrapper>(wrappedJson);

                return wrapper?.items ?? new List<FriendProfileDTO>();
            }
            catch (System.Exception e)
            {
                Debug.LogError($"[FriendService] Parse List Error: {e.Message}");
                return new List<FriendProfileDTO>();
            }
        }
    }
}