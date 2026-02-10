using VContainer;
using VContainer.Unity;
using UnityEngine;

namespace Game.Scripts.Gameplay.Core
{
    public class GameLifetimeScope : LifetimeScope
    {
        [Header("UI System")]
        [SerializeField] private GameObject _uiHudPrefab; // UI vẫn spawn vì nó nặng và cần Canvas riêng

        // XÓA HẾT các dòng [SerializeField] Prefab Manager cũ đi
        // Chúng ta không spawn từ prefab nữa, mà lấy cái có sẵn.

        protected override void Configure(IContainerBuilder builder)
        {
            // 1. UI SYSTEM (Spawn Canvas)
            if (_uiHudPrefab != null)
            {
                var uiInstance = Instantiate(_uiHudPrefab);
                builder.RegisterComponent(uiInstance.GetComponentInChildren<InventoryUIManager>());
                builder.RegisterComponent(uiInstance.GetComponentInChildren<GameplayUIManager>());
            }
            else Debug.LogError("❌ Chưa kéo UI HUD Prefab!");

            // 2. LOGIC MANAGERS (Tìm trên Hierarchy của chính Prefab này)     
            builder.RegisterComponent(GetComponentInChildren<MapDataManager>());
            builder.RegisterComponent(GetComponentInChildren<ItemSpawnerManager>());
            builder.RegisterComponent(GetComponentInChildren<MonsterSpawnerManager>());
            builder.RegisterComponent(GetComponentInChildren<PuzzleSpawnerManager>());
            builder.RegisterComponent(GetComponentInChildren<PlayerSpawner>());
            builder.RegisterComponent(GetComponentInChildren<ObjectiveManager>());

            // 3. GAME MANAGER (Nhạc trưởng)
            builder.RegisterComponent(GetComponentInChildren<GameManager>());
        }
    }
}