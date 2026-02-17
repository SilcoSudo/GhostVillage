using VContainer;
using VContainer.Unity;
using UnityEngine;
using Game.Domain.Match.Services;
using Game.Core.Scene;
using Game.Script.UI;

namespace Game.Scripts.Gameplay.Core
{
    public class GameLifetimeScope : LifetimeScope
    {
        [Header("UI System")]
        [SerializeField] private GameObject _uiHudPrefab;
        protected override void Configure(IContainerBuilder builder)
        {
            // 1. UI SYSTEM (Spawn Canvas)
            if (_uiHudPrefab != null)
            {
                var uiInstance = Instantiate(_uiHudPrefab);
                builder.RegisterComponent(uiInstance.GetComponentInChildren<InventoryUIManager>());
                builder.RegisterComponent(uiInstance.GetComponentInChildren<GameplayUIManager>());

                var resultUI = uiInstance.GetComponentInChildren<GameResultUI>(true); // true để tìm cả object ẩn
                if (resultUI != null)
                {
                    builder.RegisterComponent(resultUI);
                }
                else
                {
                    Debug.LogError("❌ Không tìm thấy GameResultUI trong HUD Prefab!");
                }
            }
            else Debug.LogError("❌ Chưa kéo UI HUD Prefab!");

            // 2. LOGIC MANAGERS (Tìm trên Hierarchy của chính Prefab này)     
            builder.RegisterComponent(GetComponentInChildren<MapDataManager>());
            builder.RegisterComponent(GetComponentInChildren<ItemSpawnerManager>());
            builder.RegisterComponent(GetComponentInChildren<MonsterSpawnerManager>());
            builder.RegisterComponent(GetComponentInChildren<PuzzleSpawnerManager>());
            builder.RegisterComponent(GetComponentInChildren<PlayerSpawner>());
            builder.RegisterComponent(GetComponentInChildren<ObjectiveManager>());
            builder.RegisterComponent(GetComponentInChildren<GameManager>());

            // 3. SERVICES (Nếu có service nào cần tạo mới hoặc override thì đăng ký ở đây)
            builder.Register<MatchDataService>(Lifetime.Scoped);
        }
    }
}