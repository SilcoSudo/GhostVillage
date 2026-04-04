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
        /// <summary>
        /// Email/Password Login Handler
        /// </summary>
        public async void HandleLogin(string email, string password, LoginUIManager view)
        {
            view.SetInteractable(false);
            _globalUI.ShowLoading(true, "Đang xác thực thông tin..."); // Bật bảng loading che màn hình

            try
            {
                var response = await _authService.LoginAsync(email, password);

                // Nếu response != null, nghĩa là Backend trả về token đàng hoàng
                if (response != null && !string.IsNullOrEmpty(response.token))
                {
                    view.gameObject.SetActive(false);

                    _globalUI.ShowLoading(true, "Đang tải dữ liệu nhân vật...");
                    var profileResponse = await _authService.FetchMyProfileAsync();

                    _globalUI.ShowLoading(true, "Đang kết nối Máy Chủ Trò Chơi...");

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
                        // Lỗi kết nối Photon
                        _globalUI.ShowLoading(false);
                        view.gameObject.SetActive(true);
                        _globalUI.ShowError("Lỗi kết nối", "Không thể kết nối đến máy chủ Photon. Vui lòng thử lại!");
                        view.SetInteractable(true);
                    }
                }
                else
                {
                    // TRƯỜNG HỢP BE TRẢ VỀ {success: false} (Sai pass, chưa verify...) => response bị null
                    _globalUI.ShowLoading(false);
                    _globalUI.ShowError("Đăng nhập thất bại", "Sai Email/Mật khẩu hoặc Tài khoản chưa xác thực!");
                    view.SetInteractable(true);
                }
            }
            catch (Exception ex)
            {
                // TRƯỜNG HỢP SERVER BE CHẾT NGẮC HOẶC MẤT MẠNG INTERNET
                _globalUI.ShowLoading(false);

                string errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc Server đang bảo trì!";

                // Vớt vát thêm nếu Exception có chứa text lỗi sâu hơn từ APIClient
                if (ex.Message.Contains("Invalid password") || ex.Message.Contains("User not found"))
                {
                    errorMessage = "Sai Email hoặc Mật khẩu!";
                }
                else if (ex.Message.Contains("ACCOUNT_NOT_VERIFIED"))
                {
                    errorMessage = "Tài khoản chưa được xác thực Email!";
                }

                _globalUI.ShowError("Lỗi Hệ Thống", errorMessage);
                view.SetInteractable(true);
            }
        }

        /// <summary>
        /// Google OAuth Login - Auto redirect
        /// </summary>
        public async UniTask HandleGoogleLogin(LoginUIManager view)
        {
            view.SetInteractable(false);

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
                }
                else
                {
                    view.SetInteractable(true);
                    _callbackServer.Stop();
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[LoginController] Google Login error: {ex.Message}");
                view.SetInteractable(true);
                _callbackServer?.Stop();
            }
        }

        private async UniTask HandleGoogleAuthorizationCodeAuto(string code, LoginUIManager view)
        {
            if (string.IsNullOrEmpty(code))
            {
                return;
            }


            var response = await _authService.HandleGoogleCallbackAsync(code.Trim());

            if (response != null)
            {
                if (!response.profileComplete)
                {
                    if (view != null)
                    {
                        view.SetInteractable(true);
                    }
                    HandleProfileIncomplete(response.token, view);
                    return;
                }

                if (!AuthService.IsUserOldEnough(response.user.dateOfBirth ?? ""))
                {
                    if (view != null)
                    {
                        view.SetInteractable(true);
                    }
                    return;
                }

                string authToken = !string.IsNullOrEmpty(response.token)
                    ? response.token
                    : (!string.IsNullOrEmpty(response.playerData?.token)
                        ? response.playerData.token
                        : response.data?.token);

                if (!string.IsNullOrEmpty(authToken))
                {
                    // Che màn hình lại
                    if (view != null) view.gameObject.SetActive(false);

                    // --- BƯỚC MỚI: FETCH PROFILE BẰNG TOKEN TỪ GOOGLE LOGIN ---
                    _globalUI.ShowLoading(true, "Đang tải dữ liệu nhân vật...");

                    // Lưu token vào session trước để hàm Fetch có thể dùng
                    _session.Token = authToken;

                    var profileResponse = await _authService.FetchMyProfileAsync();

                    _globalUI.ShowLoading(true, "Đang kết nối Máy Chủ Trò Chơi...");

                    // Lấy nickname từ profile vừa fetch
                    string nickName = (profileResponse != null && profileResponse.profile != null)
                                      ? profileResponse.profile.displayName
                                      : "Player_" + UnityEngine.Random.Range(1000, 9999);

                    // Connect Photon
                    bool connected = await _network.ConnectAsync(nickName, authToken);

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
                            view.SetInteractable(true);
                        }
                    }
                }
                else if (view != null)
                {
                    view.SetStatus("<color=red>❌ Google login response missing token</color>");
                    view.SetInteractable(true);
                }
            }
            else
            {
                string errorMsg = response?.error ?? "Unknown error";
                if (errorMsg == "age_restriction") errorMsg = "You must be at least 13 years old to play";

                if (view != null)
                {
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
            }
        }
    }
}