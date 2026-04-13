using Cysharp.Threading.Tasks;
using Game.Core.Network;
using Game.Core.Network.API;
using Game.Domain.Authentication.DTOs;
using GhostVillage.Domain.Profile;
using System;
using UnityEngine;

namespace Game.Domain.Authentication
{
    public class AuthService
    {
        private readonly APIClient _apiClient;
        private readonly GameSession _session; // THÊM DÒNG NÀY
        private const int MIN_AGE = 13;

        private const string TOKEN_KEY = "AccessToken";

        public AuthService(APIClient apiClient, GameSession session)
        {
            _apiClient = apiClient;
            _session = session;
        }


        public async UniTask<LoginResponseDTO> LoginAsync(string email, string password)
        {
            var body = new LoginRequestDTO { email = email, password = password };
            string jsonBody = JsonUtility.ToJson(body);

            // Gọi API (Lưu ý: APIClient cần update để hỗ trợ POST, code ở dưới*)
            var response = await _apiClient.PostAsync<LoginResponseDTO>("/api/auth/login", jsonBody);

            if (response != null && !string.IsNullOrEmpty(response.token))
            {
                _session.Token = response.token;
                SaveToken(response.token);
            }

            return response; // Trả về DTO cho Controller xử lý tiếp
        }


        public async UniTask<FullProfileDTO> FetchMyProfileAsync()
        {
            if (string.IsNullOrEmpty(_session.Token))
            {
                _session.EnsureTokenLoaded();
            }

            if (string.IsNullOrEmpty(_session.Token))
            {
                Debug.LogWarning("[AuthService] No token available - user not authenticated");
                return null;
            }

            // [FIX CHÍ MẠNG 1]: Sửa lại endpoint cho chuẩn với Backend
            var response = await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player", _session.Token);

            if (response != null && response.profile != null)
            {
                // [FIX CHÍ MẠNG 2]: Phải nạp UID vào Session thì Photon Chat và kết bạn mới xài được!
                _session.UID = response.uid;
                _session.DisplayName = response.profile.displayName;

                Debug.Log($"<color=green>[AuthService] Nạp Profile thành công! UID: {_session.UID} | Name: {_session.DisplayName}</color>");
            }
            else
            {
                Debug.LogError("<color=red>[AuthService] Fetch Profile thất bại hoặc API trả về rỗng!</color>");
            }

            return response;
        }

        // ===== GOOGLE OAUTH METHODS (NEW) =====

        /// <summary>
        /// Get Google OAuth URL from backend
        /// GET /api/game/auth/google
        /// </summary>
        public async UniTask<GoogleAuthUrlResponseDTO> GetGoogleAuthUrlAsync()
        {
            try
            {
                Debug.Log("[AuthService] Requesting Google OAuth URL...");
                var response = await _apiClient.GetAsync<GoogleAuthUrlResponseDTO>("/api/game/auth/google");

                // Debug: Log the response details
                if (response != null)
                {
                    Debug.Log($"[AuthService] Response received - authUrl: {response.authUrl}");
                }
                else
                {
                    Debug.LogError("[AuthService] Response is NULL!");
                }

                if (response != null && !string.IsNullOrEmpty(response.authUrl))
                {
                    Debug.Log("[AuthService] Google OAuth URL received");
                    return response;
                }

                Debug.LogWarning($"[AuthService] Failed to get OAuth URL: No authUrl in response");
                return null;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AuthService] Error getting OAuth URL: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Handle Google OAuth callback - exchange code for token
        /// GET /api/game/auth/google/callback?code={code}
        /// </summary>
        public async UniTask<GoogleAuthCallbackResponseDTO> HandleGoogleCallbackAsync(string code)
        {
            try
            {
                Debug.Log("[AuthService] Processing Google OAuth code...");
                var response = await _apiClient.GetAsync<GoogleAuthCallbackResponseDTO>(
                    $"/api/game/auth/google/callback?code={code}");

                if (response != null)
                {
                    Debug.Log("[AuthService] Google OAuth successful");
                    return response;
                }

                Debug.LogWarning($"[AuthService] OAuth failed: response is null");
                return null;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AuthService] Error handling OAuth callback: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Complete user profile by submitting date of birth
        /// POST /api/game/auth/complete-profile
        /// </summary>
        public async UniTask<CompleteProfileResponseDTO> CompleteDateOfBirthAsync(
            string token, DateTime dateOfBirth)
        {
            try
            {
                Debug.Log("[AuthService] Completing profile with date of birth...");

                var request = new CompleteProfileRequestDTO
                {
                    dateOfBirth = dateOfBirth.ToString("yyyy-MM-dd")
                };

                string jsonBody = JsonUtility.ToJson(request);

                // Include token in header
                var response = await _apiClient.PostAsyncWithAuth<CompleteProfileResponseDTO>(
                    "/api/game/auth/complete-profile", jsonBody, token);

                if (response != null)
                {
                    Debug.Log("[AuthService] Profile completed successfully");
                    return response;
                }

                Debug.LogWarning($"[AuthService] Profile completion failed: response is null");
                return null;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AuthService] Error completing profile: {ex.Message}");
                return null;
            }
        }

        // Hàm hỗ trợ lưu Token an toàn
        public void SaveToken(string token)
        {
            PlayerPrefs.SetString(TOKEN_KEY, token);
            PlayerPrefs.Save();
            Debug.Log($"<color=green>[AuthService] Token saved to PlayerPrefs: {token.Substring(0, 10)}...</color>");
        }

        /// <summary>
        /// Check if user is old enough to play (minimum age: 13)
        /// </summary>
        public static bool IsUserOldEnough(string dateOfBirthStr)
        {
            if (string.IsNullOrEmpty(dateOfBirthStr))
                return false;

            try
            {
                // Parse date from ISO format "yyyy-MM-dd"
                if (DateTime.TryParse(dateOfBirthStr, out DateTime dateOfBirth))
                {
                    DateTime today = DateTime.Now;
                    int age = today.Year - dateOfBirth.Year;

                    // Adjust age if birthday hasn't occurred this year
                    if (dateOfBirth.Date > today.AddYears(-age))
                        age--;

                    return age >= MIN_AGE;
                }

                return false;
            }
            catch
            {
                return false;
            }
        }
    }
}
