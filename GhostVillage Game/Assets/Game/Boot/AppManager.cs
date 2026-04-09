using VContainer;
using VContainer.Unity;
using UnityEngine;
using Cysharp.Threading.Tasks;
using Game.Core.Scene;
using Game.Core.Network;
using Game.Script.UI;
using Game.Domain.Settings.Controllers;
using Game.Core.Network.API;

// [FIX CHUẨN]: Import đúng namespace của sếp dựa theo Log
using GhostVillage.Domain.Profile;

namespace Game.Boot
{
    public class AppManager : IStartable
    {
        private readonly ISceneLoaderService _sceneLoader;
        private readonly INetworkService _network;
        private readonly GlobalUIManager _globalUI;
        private readonly GameSession _session;
        private readonly SettingsController _settingsController;
        private readonly APIClient _apiClient;

        public AppManager(
            ISceneLoaderService sceneLoader,
            INetworkService network,
            GlobalUIManager globalUI,
            GameSession session,
            SettingsController settingsController,
            APIClient apiClient)
        {
            _sceneLoader = sceneLoader;
            _network = network;
            _globalUI = globalUI;
            _session = session;
            _settingsController = settingsController;
            _apiClient = apiClient;
        }

        public void Start() => RunFlow().Forget();

        private async UniTaskVoid RunFlow()
        {
            _settingsController.Initialize();

            // TỰ ĐỘNG TẢI TOKEN TỪ PLAYERPREFS NẾU CÓ
            _session.LoadTokenFromStorage();

            if (_session.IsLoggedIn)
            {
                _globalUI.ShowLoading(true, "Đang kiểm tra kết nối Máy Chủ...");

                // ==========================================
                // BƯỚC BẢO MẬT: BỌC TRY-CATCH ĐỂ ĐỠ LỖI SERVER SẬP
                // ==========================================
                FullProfileDTO profileCheck = null;

                try
                {
                    // Chọc thử vào Backend
                    profileCheck = await _apiClient.GetAsyncWithAuth<FullProfileDTO>("/api/game/player", _session.Token);

                    if (profileCheck != null)
                    {
                        _session.UID = profileCheck.uid;
                        _session.DisplayName = profileCheck.profile.displayName;
                    }
                }
                catch (System.Exception ex)
                {
                    // Nếu Backend sập hoặc mất mạng, nó nhảy vào đấy, không bị crash game
                    Debug.LogWarning($"<color=yellow>[AppManager] Cảnh báo: Lỗi kết nối Backend - {ex.Message}</color>");
                    profileCheck = null; // Ép về null để chạy xuống logic đá về Login
                }

                // Kiểm tra kết quả
                if (profileCheck == null)
                {
                    Debug.LogWarning("<color=orange>[AppManager] Xác thực thất bại. Đá về màn hình Login!</color>");

                    // Xóa token cũ đi để khỏi bị auto-login sai lần nữa
                    PlayerPrefs.DeleteKey("AuthToken");
                    PlayerPrefs.Save();
                    _session.Token = "";

                    _globalUI.ShowLoading(false);
                    _globalUI.ShowError("Lỗi Kết Nối", "Máy chủ không phản hồi hoặc phiên đăng nhập đã hết hạn.");
                    await _sceneLoader.LoadSceneAsync("LoginScene");

                    return; // CẮT ĐỨT LUỒNG CHẠY TẠI ĐÂY
                }
                else
                {
                    // ========================================================
                    // [FIX CHÍ MẠNG]: Bơm đúng UID 8 số vào Session để toàn game xài kết bạn!
                    // ========================================================
                    if (!string.IsNullOrEmpty(profileCheck.uid))
                    {
                        _session.UID = profileCheck.uid;
                        _session.DisplayName = profileCheck.profile.displayName;
                        Debug.Log($"<color=green>[AppManager] Đã lưu UID chuẩn vào Session: {_session.UID}</color>");
                    }
                }

                // NẾU BACKEND SỐNG & TOKEN NGON -> KẾT NỐI PHOTON
                _globalUI.ShowLoading(true, "Đang vào sảnh chờ...");
                bool connected = await _network.ConnectAsync(_session.DisplayName, _session.Token);

                if (connected)
                {
                    await _sceneLoader.LoadSceneAsync("MainMenu");
                    _globalUI.ShowLoading(false);
                }
                else
                {
                    _globalUI.ShowLoading(false);
                    _globalUI.ShowError("Lỗi Mạng", "Không thể kết nối đến máy chủ trò chơi (Photon).");
                    await _sceneLoader.LoadSceneAsync("LoginScene");
                }
            }
            else
            {
                await _sceneLoader.LoadSceneAsync("LoginScene");
            }
        }
    }
}