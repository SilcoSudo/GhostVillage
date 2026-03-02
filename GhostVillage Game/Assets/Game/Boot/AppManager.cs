using VContainer;
using VContainer.Unity;
using UnityEngine;
using System.Threading;
using Cysharp.Threading.Tasks; // Khuyên dùng UniTask thay vì Coroutine
using Game.Core.Scene;
using Game.ScriptableObjects.GameConfig;
using Game.Core.ReactiveRepo;

namespace Game.Boot
{
    // IStartable là interface của VContainer. 
    // Khi AppLifetimeScope chạy xong, nó sẽ gọi hàm Start() của class này ngay lập tức.
    public class AppManager : IStartable
    {
        private readonly ISceneLoaderService _sceneLoader;
        private readonly PlayerDataStore _store;

        public AppManager(ISceneLoaderService sceneLoader, PlayerDataStore store)
        {
            _sceneLoader = sceneLoader;
            _store = store;
        }

        public void Start() => RunFlow().Forget();

        private async UniTaskVoid RunFlow()
        {
            // 1. Giả lập Splash Screen / Loading Config
            await UniTask.Delay(1000);

            // 2. Check xem đã đăng nhập chưa (Iteration sau sẽ check Token lưu ở LocalStorage)
            if (_store.IsLoggedIn)
            {
                await _sceneLoader.LoadSceneAsync("MainMenu");
            }
            else
            {
                // Theo Flow: Boot -> Login
                await _sceneLoader.LoadSceneAsync("Map_1");
            }
        }
    }
}