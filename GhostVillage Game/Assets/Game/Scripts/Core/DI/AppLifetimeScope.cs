using VContainer;
using VContainer.Unity;
using UnityEngine;
using Game.Core.Network;
using Game.Core.Scene;
using Game.Core.Network.API;
using Game.ScriptableObjects.GameConfig;
using Game.Domain.Authentication;
using Game.UI.Login;
using Game.Script.UI;
using Game.Core.ReactiveRepo;
using Game.Domain.Map.Services;

namespace Game.Core.DI
{
    public class AppLifetimeScope : LifetimeScope
    {
        [Header("Global Settings")]
        [SerializeField] private GameConfigSO _gameConfig; // Kéo thả ScriptableObject config chung vào đây

        [Header("Network Prefabs")]
        // Kéo Prefab chứa script PhotonNetworkManager vào đây
        [SerializeField] private PhotonNetworkManager _photonPrefab;

        // Kéo Prefab UI (Canvas + Loading) vào đây
        [SerializeField] private GlobalUIManager _globalUIPrefab;

        protected override void Awake()
        {
            base.Awake(); // Quan trọng: Phải gọi base.Awake() của VContainer
            DontDestroyOnLoad(gameObject); // Giữ GameObject này không bị hủy khi đổi Scene
        }

        protected override void Configure(IContainerBuilder builder)
        {
            // 1. Config & Data
            builder.RegisterInstance(_gameConfig);
            builder.Register<APIClient>(Lifetime.Singleton);
            builder.Register<MapDataService>(Lifetime.Singleton).As<IMapDataService>();

            // 2. Core Services
            builder.Register<SceneLoaderService>(Lifetime.Singleton).As<ISceneLoaderService>();
            builder.Register<AuthService>(Lifetime.Singleton);
            builder.Register<PlayerDataStore>(Lifetime.Singleton);
            builder.Register<PlayerDataSyncService>(Lifetime.Singleton);
            builder.Register<ProfileService>(Lifetime.Singleton);
            builder.Register<ProfileController>(Lifetime.Singleton);
            
            // 3. NETWORK (Sửa lại: Bắt buộc phải có Prefab)
            if (_photonPrefab != null)
            {
                builder.RegisterComponentInNewPrefab(_photonPrefab, Lifetime.Singleton)
                       .As<INetworkService>();
            }
            else
            {
                Debug.LogError("❌ LỖI: Chưa kéo Photon Prefab vào AppLifetimeScope!");
            }

            // 4. UI (Sửa lại: Dùng RegisterComponentInNewPrefab)
            // Thay vì tìm trong Scene, nó sẽ spawn cái Prefab UI này ra
            if (_globalUIPrefab != null)
            {
                builder.RegisterComponentInNewPrefab(_globalUIPrefab, Lifetime.Singleton);
            }
            else
            {
                Debug.LogError("❌ LỖI: Chưa kéo GlobalUI Prefab vào AppLifetimeScope!");
            }

            // Login Controller
            builder.Register<LoginController>(Lifetime.Transient);

            // 5. Entry Point
            builder.RegisterEntryPoint<Boot.AppManager>();
        }
    }
}