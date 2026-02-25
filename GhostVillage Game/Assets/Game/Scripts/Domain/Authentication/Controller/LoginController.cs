using System;
using Cysharp.Threading.Tasks;
using Game.Core.ReactiveRepo;
using Game.Core.Scene;
using Game.Domain.Authentication;
using Game.Domain.Authentication.DTOs;
using Unity.VisualScripting;
using UnityEngine;

namespace Game.UI.Login
{
    public class LoginController
    {
        [SerializeField]
        private string sceneToLoad = "MainMenu";
        private readonly AuthService _authService;
        private readonly ISceneLoaderService _sceneLoader;
        private readonly PlayerDataSyncService _syncService;
        private LocalCallbackServer _callbackServer; // Local HTTP server for OAuth callback

        public LoginController(
            AuthService authService,
            ISceneLoaderService sceneLoader,
            PlayerDataSyncService syncService)
        {
            _authService = authService;
            _sceneLoader = sceneLoader;
            _syncService = syncService;
        }

        /// <summary>
        /// Email/Password Login Handler
        /// </summary>
        public async void HandleLogin(string email, string password, LoginUIManager view)
        {
            view.SetInteractable(false);
            view.SetStatus("Connecting to Server...");

            var response = await _authService.LoginAsync(email, password);

            if (response != null)
            {
                // đang xài tạm, mốt xóa, không load vào data store nữa
                view.SetStatus("Syncing Player Data...");
                await _syncService.SyncAllDataAsync(response);

                view.SetStatus("<color=green>Đăng nhập thành công!</color>");
                await _sceneLoader.LoadSceneAsync(sceneToLoad);
            }
            else
            {
                view.SetStatus("<color=red>Login Failed!</color>");
                view.SetInteractable(true);
            }
        }

        /// <summary>
        /// Google OAuth Login - Auto redirect (no code copy-paste needed!)
        /// 1. Start local HTTP server on localhost:8888
        /// 2. Open browser with OAuth URL
        /// 3. Server automatically captures code when user authorizes
        /// 4. Exchange code for token and auto-login
        /// </summary>
        public async UniTask HandleGoogleLogin(LoginUIManager view)
        {
            view.SetInteractable(false);
            view.SetStatus("Initializing Google Login...");

            try
            {
                // Stop previous server if exists
                _callbackServer?.Stop();
                await UniTask.Delay(500); // Wait for port to be released

                // 1. Khởi động local callback server
                _callbackServer = new LocalCallbackServer(8888);
                _callbackServer.Start(async (authCode) =>
                {
                    // 3. Callback được gọi khi server nhận code từ Google
                    await HandleGoogleAuthorizationCodeAuto(authCode, view);
                });

                // 2. Lấy OAuth URL và mở browser
                var authUrlResponse = await _authService.GetGoogleAuthUrlAsync();

                if (authUrlResponse != null && !string.IsNullOrEmpty(authUrlResponse.authUrl))
                {
                    Debug.Log($"[LoginController] Opening Google OAuth: {authUrlResponse.authUrl}");
                    Application.OpenURL(authUrlResponse.authUrl);
                    view.SetStatus("🌐 Browser opened.\n⏳ Waiting for authorization...");
                }
                else
                {
                    view.SetStatus($"<color=red>Error: Failed to get auth URL</color>");
                    view.SetInteractable(true);
                    _callbackServer.Stop();
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[LoginController] Google Login error: {ex.Message}");
                view.SetStatus($"<color=red>Error: {ex.Message}</color>");
                view.SetInteractable(true);
                _callbackServer?.Stop();
            }
        }

        /// <summary>
        /// Auto-handle authorization code (called by local callback server)
        /// </summary>
        private async UniTask HandleGoogleAuthorizationCodeAuto(string code, LoginUIManager view)
        {
            if (string.IsNullOrEmpty(code))
            {
                if (view != null)
                    view.SetStatus("<color=red>Invalid authorization code</color>");
                return;
            }

            if (view != null)
                view.SetStatus("🔄 Processing authorization...");

            var response = await _authService.HandleGoogleCallbackAsync(code.Trim());

            if (response != null)
            {
                // Profile incomplete - show completion UI (includes age verification)
                if (!response.profileComplete)
                {
                    if (view != null)
                    {
                        view.SetStatus("⚠️ Please complete your profile (Add date of birth)");
                        view.SetInteractable(true);
                    }

                    // Show profile completion UI (birthday picker for age verification)
                    HandleProfileIncomplete(response.token, view);
                    return;
                }

                // Age verification (after profile has dateOfBirth)
                if (!AuthService.IsUserOldEnough(response.user.dateOfBirth ?? ""))
                {
                    if (view != null)
                    {
                        view.SetStatus("<color=red>❌ You must be at least 13 years old to play</color>");
                        view.SetInteractable(true);
                    }
                    return;
                }

                // All checks passed
                if (response.data != null)
                {
                    if (view != null)
                        view.SetStatus("Syncing Player Data...");
                    await _syncService.SyncAllDataAsync(response.data);

                    if (view != null)
                        view.SetStatus("<color=green>Google Login Successful!</color>");
                    await _sceneLoader.LoadSceneAsync(sceneToLoad);
                }
            }
            else
            {
                string errorMsg = response?.error ?? "Unknown error";
                if (errorMsg == "age_restriction")
                    errorMsg = "You must be at least 13 years old to play";

                if (view != null)
                {
                    view.SetStatus($"<color=red>❌ Error: {errorMsg}</color>");
                    view.SetInteractable(true);
                }
            }

            // Stop callback server
            _callbackServer?.Stop();
        }

        /// <summary>
        /// Handle incomplete profile - show date of birth picker
        /// </summary>
        private void HandleProfileIncomplete(string token, LoginUIManager view)
        {
            if (view == null)
            {
                Debug.LogError("[LoginController] LoginUIManager is null!");
                return;
            }

            Debug.Log("[LoginController] Profile incomplete, showing completion UI");

            // Get ProfileCompletionUI from BirthdayVerifyPanel
            var birthdayPanel = view.GetBirthdayVerifyPanel();
            if (birthdayPanel == null)
            {
                Debug.LogError("[LoginController] BirthdayVerifyPanel not found!");
                view.SetStatus("<color=red>Error: Birthday panel not available</color>");
                return;
            }

            var profileCompletionPanel = birthdayPanel.GetComponent<ProfileCompletionUI>();

            if (profileCompletionPanel != null)
            {
                // Create and initialize controller
                var profileController = new ProfileCompletionController(
                    _authService,
                    _sceneLoader,
                    _syncService);

                profileController.Initialize(token);
                profileCompletionPanel.Initialize(profileController, view);

                // Show profile completion UI (hide login UI panel, not the manager)
                view.ShowPanel(birthdayPanel);
            }
            else
            {
                Debug.LogError("[LoginController] ProfileCompletionUI component not found on BirthdayVerifyPanel!");
                view.SetStatus("<color=red>Error: Profile UI component not available</color>");
            }
        }
    }
}