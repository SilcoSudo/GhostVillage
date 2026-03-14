using System;
using Cysharp.Threading.Tasks;
using Game.Core.Network;
using Game.Core.Scene;
using Game.Domain.Authentication;
using Game.Domain.Authentication.DTOs;
using Game.Script.UI;
using Unity.VisualScripting;
using UnityEngine;

namespace Game.UI.Login
{
    public class LoginController
    {
        [SerializeField] private string sceneToLoad = "MainMenu";
        private readonly AuthService _authService;
        private readonly ISceneLoaderService _sceneLoader;
        private readonly GameSession _session; // THAY SYNC SERVICE BẰNG SESSION
        private readonly INetworkService _network;
        private readonly GlobalUIManager _globalUI;
        private LocalCallbackServer _callbackServer;

        // [SỬA] Inject thêm Network và GlobalUI
        public LoginController(AuthService authService, ISceneLoaderService sceneLoader, INetworkService network, GlobalUIManager globalUI, GameSession session)
        {
            _authService = authService;
            _sceneLoader = sceneLoader;
            _network = network;
            _globalUI = globalUI;
            _session = session;
        }

        /// <summary>
        /// Email/Password Login Handler
        /// </summary>
        public async void HandleLogin(string email, string password, LoginUIManager view)
        {
            view.SetInteractable(false);
            view.SetStatus("Connecting to API...");

            var response = await _authService.LoginAsync(email, password);

            if (response != null)
            {
                view.gameObject.SetActive(false);

                // --- BƯỚC MỚI: FETCH PROFILE SAU KHI CÓ TOKEN ---
                _globalUI.ShowLoading(true, "Đang tải dữ liệu nhân vật...");
                var profileResponse = await _authService.FetchMyProfileAsync();

                _globalUI.ShowLoading(true, "Đang kết nối Máy Chủ Trò Chơi...");

                // Lấy Nickname từ profile vừa fetch
                string nickName = (profileResponse != null && profileResponse.profile != null)
                                  ? profileResponse.profile.displayName
                                  : "Player_" + UnityEngine.Random.Range(1000, 9999);

                bool connected = await _network.ConnectAsync(nickName, response.token);

                if (connected)
                {
                    await _sceneLoader.LoadSceneAsync(sceneToLoad);
                    _globalUI.ShowLoading(false);
                }
                else
                {
                    _globalUI.ShowLoading(false);
                    view.gameObject.SetActive(true);
                    view.SetStatus("<color=red>Lỗi kết nối Photon!</color>");
                    view.SetInteractable(true);
                }
            }
            else
            {
                view.SetStatus("<color=red>Login Failed!</color>");
                view.SetInteractable(true);
            }
        }

        /// <summary>
        /// Google OAuth Login - Auto redirect
        /// </summary>
        public async UniTask HandleGoogleLogin(LoginUIManager view)
        {
            view.SetInteractable(false);
            view.SetStatus("Initializing Google Login...");

            try
            {
                _callbackServer?.Stop();
                await UniTask.Delay(500);

                _callbackServer = new LocalCallbackServer(8888);
                _callbackServer.Start(async (authCode) =>
                {
                    await HandleGoogleAuthorizationCodeAuto(authCode, view);
                });

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

        private async UniTask HandleGoogleAuthorizationCodeAuto(string code, LoginUIManager view)
        {
            if (string.IsNullOrEmpty(code))
            {
                if (view != null) view.SetStatus("<color=red>Invalid authorization code</color>");
                return;
            }

            if (view != null) view.SetStatus("🔄 Processing authorization...");

            var response = await _authService.HandleGoogleCallbackAsync(code.Trim());

            if (response != null)
            {
                if (!response.profileComplete)
                {
                    if (view != null)
                    {
                        view.SetStatus("⚠️ Please complete your profile");
                        view.SetInteractable(true);
                    }
                    HandleProfileIncomplete(response.token, view);
                    return;
                }

                if (!AuthService.IsUserOldEnough(response.user.dateOfBirth ?? ""))
                {
                    if (view != null)
                    {
                        view.SetStatus("<color=red>❌ You must be at least 13 years old to play</color>");
                        view.SetInteractable(true);
                    }
                    return;
                }

                if (response.data != null)
                {
                    // Che màn hình lại
                    if (view != null) view.gameObject.SetActive(false);

                    // --- BƯỚC MỚI: FETCH PROFILE BẰNG TOKEN TỪ GOOGLE LOGIN ---
                    _globalUI.ShowLoading(true, "Đang tải dữ liệu nhân vật...");

                    // Lưu token vào session trước để hàm Fetch có thể dùng
                    _session.Token = response.data.token;

                    var profileResponse = await _authService.FetchMyProfileAsync();

                    _globalUI.ShowLoading(true, "Đang kết nối Máy Chủ Trò Chơi...");

                    // Lấy nickname từ profile vừa fetch
                    string nickName = (profileResponse != null && profileResponse.profile != null)
                                      ? profileResponse.profile.displayName
                                      : "Player_" + UnityEngine.Random.Range(1000, 9999);

                    // Connect Photon
                    bool connected = await _network.ConnectAsync(nickName, response.data.token);

                    if (connected)
                    {
                        await _sceneLoader.LoadSceneAsync(sceneToLoad);
                        _globalUI.ShowLoading(false);
                    }
                    else
                    {
                        _globalUI.ShowLoading(false);
                        if (view != null)
                        {
                            view.gameObject.SetActive(true);
                            view.SetStatus("<color=red>Lỗi kết nối Photon!</color>");
                            view.SetInteractable(true);
                        }
                    }
                }
            }
            else
            {
                string errorMsg = response?.error ?? "Unknown error";
                if (errorMsg == "age_restriction") errorMsg = "You must be at least 13 years old to play";

                if (view != null)
                {
                    view.SetStatus($"<color=red>❌ Error: {errorMsg}</color>");
                    view.SetInteractable(true);
                }
            }

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
                // [FIX] TRUYỀN SESSION VÀO THAY VÌ SYNCSERVICE
                var profileController = new ProfileCompletionController(
                    _authService,
                    _sceneLoader,
                    _session);

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