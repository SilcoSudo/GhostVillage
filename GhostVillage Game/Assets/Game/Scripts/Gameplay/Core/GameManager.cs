using Photon.Pun;
using UnityEngine;
using VContainer;

public class GameManager : MonoBehaviour
{

    public GameState CurrentState { get; private set; }

    // --- DEPENDENCY INJECTION ---
    private MapDataManager _mapData;
    private ItemSpawnerManager _itemSpawner;
    private MonsterSpawnerManager _monsterSpawner;
    private PuzzleSpawnerManager _puzzleSpawner;
    private PlayerSpawner _playerSpawner;

    // VContainer sẽ tự động điền các biến này vào khi game bắt đầu
    [Inject]
    public void Construct(
        MapDataManager mapData,
        ItemSpawnerManager itemSpawner,
        MonsterSpawnerManager monsterSpawner,
        PuzzleSpawnerManager puzzleSpawner,
        PlayerSpawner playerSpawner
        )
    {
        _mapData = mapData;
        _itemSpawner = itemSpawner;
        _monsterSpawner = monsterSpawner;
        _puzzleSpawner = puzzleSpawner;
        _playerSpawner = playerSpawner;
    }

    private void Start()
    {
        Debug.Log("<color=cyan>[GameManager]</color> Khởi động vòng lặp Game...");

        // 1. Index Map
        _mapData.InitializeMap();

        // 2. Spawn World (Master only)
        if (PhotonNetwork.IsMasterClient)
        {
            var config = _mapData.CurrentMapConfig;
            if (config != null)
            {
                _itemSpawner.SpawnItems(config.consumableConfig, _mapData);
                _monsterSpawner.SpawnMonsters(config.monsterSystemConfig, _mapData);
                _puzzleSpawner.SpawnPuzzles(config.puzzleConfig, _mapData);
            }
        }

        // 3. Spawn Player
        _playerSpawner.SpawnLocalPlayer(_mapData);

        SetState(GameState.Playing);
    }

    public void SetState(GameState newState)
    {
        CurrentState = newState;
        Debug.Log($"[GameManager] State changed to: {newState}");
    }

    private void OnEnable()
    {
        ObjectiveManager.OnAnyObjectiveCompleted += HandleObjectiveComplete;
    }

    private void OnDisable()
    {
        ObjectiveManager.OnAnyObjectiveCompleted -= HandleObjectiveComplete;
    }

    private void HandleObjectiveComplete()
    {
        SetState(GameState.Triggered);
    }
}