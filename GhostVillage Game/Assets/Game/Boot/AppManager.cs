using VContainer;
using VContainer.Unity;
using UnityEngine;
using Cysharp.Threading.Tasks;
using Game.Core.Scene;
using Game.Core.ReactiveRepo;
using Game.Core.Network;
using Game.Script.UI;

namespace Game.Boot
{
    public class AppManager : IStartable
    {
        private readonly ISceneLoaderService _sceneLoader;
        private readonly PlayerDataStore _store;
        private readonly INetworkService _network;
        private readonly GlobalUIManager _globalUI;

        // [SỬA] Inject thêm Network và GlobalUI
        public AppManager(ISceneLoaderService sceneLoader, PlayerDataStore store, INetworkService network, GlobalUIManager globalUI)
        {
            _sceneLoader = sceneLoader;
            _store = store;
            _network = network;
            _globalUI = globalUI;
        }

        public void Start() => RunFlow().Forget();

        private async UniTaskVoid RunFlow()
        {
            await UniTask.Delay(1000);

            if (_store.IsLoggedIn)
            {
                _globalUI.ShowLoading(true, "Đang kết nối Máy Chủ...");

                // ✅ KẾT NỐI PHOTON VỚI TOKEN TỬ STORE
                bool connected = await _network.ConnectAsync(_store.DisplayName.Value, _store.AuthToken.Value);

                if (connected)
                {
                    await _sceneLoader.LoadSceneAsync("MainMenu");
                    _globalUI.ShowLoading(false); // Xong hết mới tắt
                }
                else
                {
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