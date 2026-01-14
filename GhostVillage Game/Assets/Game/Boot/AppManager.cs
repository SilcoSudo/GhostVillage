using VContainer;
using VContainer.Unity;
using UnityEngine;
using System.Threading;
using Cysharp.Threading.Tasks; // Khuyên dùng UniTask thay vì Coroutine
using Game.Core.Scene;
using Game.ScriptableObjects.GameConfig;
using UnityEngine.SceneManagement;
using Game.Domain.Account.Service;

namespace Game.Boot
{
    // IStartable là interface của VContainer. 
    // Khi AppLifetimeScope chạy xong, nó sẽ gọi hàm Start() của class này ngay lập tức.
    public class AppManager : IStartable
    {
        private readonly ISceneLoaderService _sceneLoader;
        private readonly AccountService _account;
        private readonly GameConfigSO _config;

        public AppManager(ISceneLoaderService sceneLoader, AccountService account)
        {
            _sceneLoader = sceneLoader;
            _account = account;
        }

        public void Start()
        {
            RunFlow().Forget();
        }

        private async UniTaskVoid RunFlow()
        {
            // 1. Giả lập Splash Screen / Loading Config
            await UniTask.Delay(1000);

            // 2. Check xem đã đăng nhập chưa (Iteration sau sẽ check Token lưu ở LocalStorage)
            if (_account.IsLoggedIn)
            {
                await _sceneLoader.LoadSceneAsync("GameScene");
            }
            else
            {
                // Theo Flow: Boot -> Login
                await _sceneLoader.LoadSceneAsync("LoginScene");
            }
        }
    }
}