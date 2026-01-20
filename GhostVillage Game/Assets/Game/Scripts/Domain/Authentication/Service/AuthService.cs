using Cysharp.Threading.Tasks;
using Game.Core.Network.API;
using Game.Domain.Authentication.DTOs;
using UnityEngine;

namespace Game.Domain.Authentication
{
    public class AuthService
    {
        private readonly APIClient _apiClient;

        public AuthService(APIClient apiClient) => _apiClient = apiClient;


        public async UniTask<LoginResponseDTO> LoginAsync(string email, string password)
        {
            var body = new LoginRequestDTO { email = email, password = password };
            string jsonBody = JsonUtility.ToJson(body);


            // Gọi API (Lưu ý: APIClient cần update để hỗ trợ POST, code ở dưới*)
            var response = await _apiClient.PostAsync<LoginResponseDTO>("/api/auth/login", jsonBody);
            return response; // Trả về DTO cho Controller xử lý tiếp
        }
    }
}