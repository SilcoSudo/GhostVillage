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
        private readonly GameSession _session;

        [Inject]
        public FriendService(APIClient apiClient, GameSession session)
        {
            _apiClient = apiClient;
            _session = session;
        }

        private string Token => _session.Token;

        [System.Obsolete]
        public async UniTask<PlayerSearchDTO> SearchPlayerAsync(string uid)
        {
            string endpoint = $"/api/game/player/search/{uid}";
            return await _apiClient.GetAsyncWithAuth<PlayerSearchDTO>(endpoint, Token);
        }

        [System.Obsolete]
        public async UniTask<bool> AddFriendAsync(string targetId)
        {
            string realUserId = targetId;

            if (targetId.Length == 8)
            {
                var searchData = await SearchPlayerAsync(targetId);
                if (searchData == null || string.IsNullOrEmpty(searchData.userId))
                {
                    Debug.LogError($"[FriendService] Lỗi: Không tìm thấy mã MongoDB UserId cho UID: {targetId}");
                    return false;
                }
                realUserId = searchData.userId;
            }

            string endpoint = "/api/web/friend/add";
            var body = new FriendRequestBody { targetUserId = realUserId };
            string jsonBody = JsonUtility.ToJson(body);

            // [FIX CHÍ MẠNG 1]: Dùng SimpleResponseDTO thay cho <object>
            var response = await _apiClient.PostAsyncWithAuth<SimpleResponseDTO>(endpoint, jsonBody, Token);
            return response != null;
        }

        [System.Obsolete]
        public async UniTask<bool> AcceptFriendAsync(string friendshipId)
        {
            string endpoint = "/api/web/friend/accept";
            var body = new FriendRequestBody { friendshipId = friendshipId };
            string jsonBody = JsonUtility.ToJson(body);

            var response = await _apiClient.PostAsyncWithAuth<SimpleResponseDTO>(endpoint, jsonBody, Token);
            return response != null;
        }

        [System.Obsolete]
        public async UniTask<bool> RejectFriendAsync(string friendshipId)
        {
            string endpoint = "/api/web/friend/reject";
            var body = new FriendRequestBody { friendshipId = friendshipId };
            string jsonBody = JsonUtility.ToJson(body);

            var response = await _apiClient.PostAsyncWithAuth<SimpleResponseDTO>(endpoint, jsonBody, Token);
            return response != null;
        }

        [System.Obsolete]
        public async UniTask<bool> UnfriendAsync(string targetId)
        {
            string realUserId = targetId;

            if (targetId.Length == 8)
            {
                var searchData = await SearchPlayerAsync(targetId);
                if (searchData != null && !string.IsNullOrEmpty(searchData.userId))
                {
                    realUserId = searchData.userId;
                }
            }

            string endpoint = "/api/web/friend/unfriend";
            var body = new FriendRequestBody { targetUserId = realUserId };
            string jsonBody = JsonUtility.ToJson(body);

            var response = await _apiClient.PostAsyncWithAuth<SimpleResponseDTO>(endpoint, jsonBody, Token);
            return response != null;
        }

        public async UniTask<List<FriendProfileDTO>> GetFriendListAsync()
            => await GetListAsync("/api/web/friend/list");

        public async UniTask<List<FriendProfileDTO>> GetPendingRequestsAsync()
            => await GetListAsync("/api/web/friend/pending-requests");

        public async UniTask<List<FriendProfileDTO>> GetSentRequestsAsync()
            => await GetListAsync("/api/web/friend/sent-requests");

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

    // DTO Cứu mạng cho các API trả về rỗng hoặc message đơn giản
    [System.Serializable]
    public class SimpleResponseDTO
    {
        public string message;
    }
}