using VContainer;
using VContainer.Unity;
using UnityEngine;
using System.Threading;
using Cysharp.Threading.Tasks; // Khuyên dùng UniTask thay vì Coroutine
using Game.Core.Scenes;
using Game.ScriptableObjects.GameConfig;
using UnityEngine.SceneManagement;

namespace Game.Boot
{
    // IStartable là interface của VContainer. 
    // Khi AppLifetimeScope chạy xong, nó sẽ gọi hàm Start() của class này ngay lập tức.
    public class AppManager : IStartable
    {
        private readonly ISceneLoaderService _sceneLoader;
        private readonly GameConfigSO _config;

        // Constructor Injection: Tự động nhận Service đã đăng ký bên Scope
        [Inject]
        public AppManager(ISceneLoaderService sceneLoader, GameConfigSO config)
        {
            _sceneLoader = sceneLoader;
            _config = config;
        }

        public void Start()
        {
            LoadGameScene().Forget();
        }

        private async UniTaskVoid LoadGameScene()
        {
            // Giả lập loading nhẹ
            await UniTask.Delay(1000);

            // Chuyển sang Scene tên là "GameScene"
            // Đảm bảo bạn đã add scene này vào Build Settings
            SceneManager.LoadScene("GameScene");
        }
    }
}