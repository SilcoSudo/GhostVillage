using VContainer;
using VContainer.Unity;
using UnityEngine;
using Cysharp.Threading.Tasks;
using Game.Core.Scene;
using Game.Core.Network;
using Game.Script.UI;
using Game.Domain.Settings.Controllers;

namespace Game.Boot
{
    public class AppManager : IStartable
    {
        private readonly ISceneLoaderService _sceneLoader;
        private readonly INetworkService _network;
        private readonly GlobalUIManager _globalUI;
        private readonly GameSession _session;
        private readonly SettingsController _settingsController;


        public AppManager(
            ISceneLoaderService sceneLoader,
            INetworkService network,
            GlobalUIManager globalUI,
            GameSession session,
            SettingsController settingsController)
        {
            _sceneLoader = sceneLoader;
            _network = network;
            _globalUI = globalUI;
            _session = session;
            _settingsController = settingsController;
        }

        public void Start() => RunFlow().Forget();

        private async UniTaskVoid RunFlow()
        {
            _settingsController.Initialize();

            //  TỰ ĐỘNG TẢI TOKEN TỬ PLAYERPREFS NẾU CÓ
            _session.LoadTokenFromStorage();

            if (_session.IsLoggedIn)
            {
                _globalUI.ShowLoading(true, "Đang kết nối Máy Chủ...");

                bool connected = await _network.ConnectAsync(_session.DisplayName, _session.Token);

                if (connected)
                {
                    //MainMenu
                    await _sceneLoader.LoadSceneAsync("MainMenu");
                    _globalUI.ShowLoading(false);
                }
                else
                {
                    //LoginScene
                    _globalUI.ShowLoading(false);
                    _globalUI.ShowError("Lỗi Mạng", "Không thể kết nối đến máy chủ trò chơi.");
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