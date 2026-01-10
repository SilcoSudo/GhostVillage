using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using Game.Domain.Authentication.DTOs;
using UnityEngine;
using Game.Domain.Account.Service;

namespace Game.Domain.Authentication
{
    public class AuthService
    {
        private readonly APIClient _apiClient;

        // AccountService dùng để lưu data sau khi login thành công
        private readonly AccountService _accountService;

        public AuthService(APIClient apiClient, AccountService accountService)
        {
            _apiClient = apiClient;
            _accountService = accountService;
        }

        public async UniTask<bool> LoginAsync(string email, string password)
        {
            // Tạo body JSON gửi đi
            // var body = new { username, password };

            // Dùng class cụ thể , không có new như trên, body sẽ bị rỗng
            var body = new LoginRequestDTO
            {
                email = email,
                password = password
            };

            string jsonBody = JsonUtility.ToJson(body);

            Debug.Log($"[AuthService] Sending Login Body: {jsonBody}");

            // Gọi API (Lưu ý: APIClient cần update để hỗ trợ POST, code ở dưới*)
            var response = await _apiClient.PostAsync<LoginResponseDTO>("/api/auth/login", jsonBody);

            if (response != null)
            {
                Debug.Log($"✅ Login Success! Welcome {response.player.profile.displayName}");

                // Lưu data vào Memory để dùng xuyên suốt game
                _accountService.SetPlayerData(response);
                return true;
            }

            return false;
        }
    }
}