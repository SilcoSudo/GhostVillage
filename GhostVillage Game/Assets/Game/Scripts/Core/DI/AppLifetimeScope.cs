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
using Game.Domain.Map.Services;
using Game.Domain.Friend.Services;
using Game.Domain.Friend.Controllers;
using Game.Domain.Settings.Services;
using Game.Domain.Settings.Controllers;
using GhostVillage.Shop;
using GhostVillage.Storage;

namespace Game.Core.DI
{
    public class AppLifetimeScope : LifetimeScope
    {
        [Header("Global Settings")]
        [SerializeField] private GameConfigSO _gameConfig; // Kéo thả ScriptableObject config chung vào đây
        [SerializeField] private ItemDatabaseSO _shopItemDatabase; // Thêm Database cửa hàng vào đây

        [Header("Network Prefabs")]
        // Kéo Prefab chứa script PhotonNetworkManager vào đây
        [SerializeField] private PhotonNetworkManager _photonPrefab;

        // Kéo Prefab UI (Canvas + Loading) vào đây
        [SerializeField] private GameObject _globalUIPrefab; // ĐÃ TRẢ LẠI THÀNH GAMEOBJECT
        protected override void Awake()
        {
            base.Awake(); // Quan trọng: Phải gọi base.Awake() của VContainer
            DontDestroyOnLoad(gameObject); // Giữ GameObject này không bị hủy khi đổi Scene
        }

        protected override void Configure(IContainerBuilder builder)
        {
            // 1. Config & Data
            builder.RegisterInstance(_gameConfig);
            builder.RegisterInstance(_shopItemDatabase);
            builder.Register<APIClient>(Lifetime.Singleton);
            builder.Register<MapDataService>(Lifetime.Singleton).As<IMapDataService>();

            // 2. Core Services
            builder.Register<SceneLoaderService>(Lifetime.Singleton).As<ISceneLoaderService>();
            builder.Register<AuthService>(Lifetime.Singleton);
            builder.Register<GameSession>(Lifetime.Singleton);
            builder.Register<ProfileService>(Lifetime.Singleton);
            builder.Register<ProfileController>(Lifetime.Singleton);
            builder.Register<FriendService>(Lifetime.Singleton);
            builder.Register<FriendController>(Lifetime.Singleton);
            builder.Register<SettingsSaveLoadService>(Lifetime.Singleton);
            builder.Register<GraphicsSettingService>(Lifetime.Singleton);
            builder.Register<AudioSettingService>(Lifetime.Singleton);
            builder.Register<SettingsController>(Lifetime.Singleton);
            builder.Register<PlayerInputActions>(Lifetime.Singleton);
            builder.Register<InputRebindService>(Lifetime.Singleton);

            builder.Register<ShopService>(Lifetime.Singleton);
            builder.Register<StorageService>(Lifetime.Singleton);
            
            // 3. NETWORK (Sửa lại: Bắt buộc phải có Prefab)
            if (_photonPrefab != null)
            {
                builder.RegisterComponentInNewPrefab(_photonPrefab, Lifetime.Singleton)
                       .As<INetworkService>();
            }
            else
            {
                Debug.LogError(" LỖI: Chưa kéo Photon Prefab vào AppLifetimeScope!");
            }

            // ==========================================
            // [THÊM MỚI] 3.5 TẠO VÀ ĐĂNG KÝ GLOBAL CHAT MANAGER
            // ==========================================
            builder.RegisterComponentOnNewGameObject<Game.Core.Network.Chat.GlobalChatManager>(Lifetime.Singleton, "GlobalChatManager_Auto");
            // ==========================================

            // 4. UI (Tự Instantiate và đăng ký)
            if (_globalUIPrefab != null)
            {
                var uiObj = Instantiate(_globalUIPrefab);
                DontDestroyOnLoad(uiObj);

                var uiManager = uiObj.GetComponent<GlobalUIManager>();
                if (uiManager != null)
                {
                    builder.RegisterInstance(uiManager);
                }

                // ĐÂY LÀ ĐÒN CHÍ MẠNG DIỆT LỖI Ở DÒNG 113: 
                // Yêu cầu VContainer quét toàn bộ GameObject này và tiêm _settingsController vào SettingsUIManager
                builder.RegisterBuildCallback(resolver => resolver.InjectGameObject(uiObj));
            }
            else
            {
                Debug.LogError(" LỖI: Chưa kéo GlobalUI Prefab vào AppLifetimeScope!");
            }

            // Login Controller
            builder.Register<LoginController>(Lifetime.Transient);

            // 5. Entry Point
            builder.RegisterEntryPoint<Boot.AppManager>();
        }
    }
}