using VContainer;
using VContainer.Unity;
using UnityEngine;
using Game.Core.Network;
using Game.Core.Scenes;
using Game.Core.Network.API;
using Game.Domain.Maps;
using Game.ScriptableObjects.GameConfig;
// using Game.Domain.Authentication; // Sau này sẽ dùng
// Lmao

namespace Game.Core.DI
{
    public class AppLifetimeScope : LifetimeScope
    {
        [Header("Global Settings")]
        [SerializeField] private GameConfigSO _gameConfig; // Kéo thả ScriptableObject config chung vào đây

        protected override void Awake()
        {
            base.Awake(); // Quan trọng: Phải gọi base.Awake() của VContainer
            DontDestroyOnLoad(gameObject); // Giữ GameObject này không bị hủy khi đổi Scene
        }

        protected override void Configure(IContainerBuilder builder)
        {
            // 1. Config
            builder.RegisterInstance(_gameConfig);

            // 2. API Client
            builder.Register<APIClient>(Lifetime.Singleton);

            // 3. Map Data Service
            builder.Register<MapDataService>(Lifetime.Singleton).As<IMapDataService>();

            // 4. Scene Loader
            builder.Register<SceneLoaderService>(Lifetime.Singleton).As<ISceneLoaderService>();

            // 5. Entry Point (AppManager)
            builder.RegisterEntryPoint<Boot.AppManager>();
        }
    }
}