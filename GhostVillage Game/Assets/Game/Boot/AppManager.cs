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

        [System.Obsolete]
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
                    _globalUI.ShowError("Connection Error", "Server not responding or session expired.");
                    await _sceneLoader.LoadSceneAsync("LoginScene");

                    return; // CẮT ĐỨT LUỒNG CHẠY TẠI ĐÂY
                }
                else
                {
                    if (profileCheck.profile != null)
                    {
                        _session.UID = profileCheck.uid; // Cất 8 số xài cho kết bạn
                        _session.DisplayName = profileCheck.profile.displayName;

                        string finalMongoId = !string.IsNullOrEmpty(profileCheck.userId)
                                              ? profileCheck.userId
                                              : profileCheck.uid;

                        // Ép lưu MongoID 24 ký tự xuống máy để xíu nữa Photon bốc lên xài
                        PlayerPrefs.SetString("UserId", finalMongoId);
                        PlayerPrefs.Save();

                        Debug.Log($"<color=green>[AppManager] Đã lưu UID: {_session.UID} | MongoID: {finalMongoId}</color>");
                    }
                }

                // NẾU BACKEND SỐNG & TOKEN NGON -> KẾT NỐI PHOTON
                _globalUI.ShowLoading(true, "Joining...");
                bool connected = await _network.ConnectAsync(_session.DisplayName, _session.Token);

                if (connected)
                {
                    await _sceneLoader.LoadSceneAsync("MainMenu");
                    _globalUI.ShowLoading(false);
                }
                else
                {
                    _globalUI.ShowLoading(false);
                    _globalUI.ShowError("Network Error", "Cannot connect to game server (Photon).");
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