using UnityEngine;
using Game.Domain.Map.DTOs;
using Game.Scripts.View.Lobby.Session; // Namespace chứa GameDataTransfer

public class MapDataManager : MonoBehaviour
{
    public static MapDataManager Instance;
    public MapConfigDTO CurrentMapConfig { get; private set; } // DTO clean

    private void Awake()
    {
        Instance = this;
    }

    public void InitializeMap()
    {
        // 1. Lấy DTO thô từ Lobby chuyển sang
        var rawConfig = GameDataTransfer.Instance?.SelectedMapConfig;

        if (rawConfig == null)
        {
            Debug.LogError("[MapData] CRITICAL: Không có Config map!");
            return;
        }

        // 2. Lưu lại để dùng
        // Lưu ý: MapConfigDTO của bạn cấu trúc đang tốt, có thể dùng trực tiếp
        Debug.Log($"[MapData] Initializing Map: {rawConfig.identityConfig.displayName}");

        // 3. Gọi các Spawner làm việc (Giai đoạn 2)
        // ItemSpawner.Instance.SpawnItems(rawConfig.consumableConfig);
        // MonsterSpawner.Instance.SpawnMonsters(rawConfig.monsterSystemConfig);
    }
}