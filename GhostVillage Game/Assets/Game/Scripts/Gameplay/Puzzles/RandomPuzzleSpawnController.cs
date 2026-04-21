using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using ExitGames.Client.Photon;
using Game.Core.Database;
using Photon.Pun;
using UnityEngine;
using UnityEngine.SceneManagement;

[DefaultExecutionOrder(-500)]
public class RandomPuzzleSpawnController : MonoBehaviourPunCallbacks
{
    [Header("References")]
    [SerializeField] private GameResourceDatabaseSO resourceDatabase;

    [Header("Spawn Settings")]
    [SerializeField] private string puzzleSpawnTag = "SP_Puzzle";
    [SerializeField] private int maxSpawnCountOverride = -1;
    [SerializeField] private bool disableCorePuzzleSpawner = true;

    [Header("Room Sync")]
    [SerializeField] private bool spawnOnlyOncePerRoom = true;
    [SerializeField] private string roomSpawnedKey = "RndPuzzleSpawned";
    [SerializeField] private string roomSeedKey = "RndPuzzleSeed";

    [Header("Debug")]
    [SerializeField] private bool useFixedSeedForDebug = false;
    [SerializeField] private int fixedSeed = 12345;
    [SerializeField] private float waitForMapDataTimeout = 10f;

    private bool _started;

    private void Awake()
    {
        if (disableCorePuzzleSpawner)
        {
            // Disable Core spawner as early as possible to avoid Start-order races.
            DisableCorePuzzleSpawnerIfPresent();
        }
    }

    private void Start()
    {
        if (_started) return;
        _started = true;

        StartCoroutine(SpawnRoutine());
    }

    public override void OnJoinedRoom()
    {
        base.OnJoinedRoom();

        if (_started) return;
        _started = true;
        StartCoroutine(SpawnRoutine());
    }

    private IEnumerator SpawnRoutine()
    {
        float timer = 0f;
        MapDataManager mapData = null;

        while (timer < waitForMapDataTimeout)
        {
            mapData = FindObjectOfType<MapDataManager>();
            if (PhotonNetwork.IsConnectedAndReady && PhotonNetwork.InRoom && mapData != null && mapData.CurrentMapConfig != null)
            {
                break;
            }

            timer += Time.deltaTime;
            yield return null;
        }

        if (!PhotonNetwork.IsConnectedAndReady || !PhotonNetwork.InRoom)
        {
            Debug.LogWarning("[RandomPuzzleSpawn] Photon room chưa sẵn sàng, hủy spawn.");
            yield break;
        }

        if (mapData == null || mapData.CurrentMapConfig == null)
        {
            Debug.LogWarning("[RandomPuzzleSpawn] Chưa có MapData/MapConfig, hủy spawn.");
            yield break;
        }

        if (!PhotonNetwork.IsMasterClient)
        {
            yield break;
        }

        if (resourceDatabase == null)
        {
            TryResolveResourceDatabase();
            if (resourceDatabase == null)
            {
                Debug.LogError("[RandomPuzzleSpawn] Thiếu resourceDatabase reference.");
                yield break;
            }
        }

        string scopedSpawnedKey = BuildScopedRoomKey(roomSpawnedKey, mapData);
        string scopedSeedKey = BuildScopedRoomKey(roomSeedKey, mapData);

        if (spawnOnlyOncePerRoom
            && PhotonNetwork.CurrentRoom.CustomProperties.TryGetValue(scopedSpawnedKey, out object spawnedObj)
            && spawnedObj is bool alreadySpawned
            && alreadySpawned)
        {
            Debug.Log($"[RandomPuzzleSpawn] Room này đã spawn puzzle trước đó ({scopedSpawnedKey}).");
            yield break;
        }

        var puzzleConfig = mapData.CurrentMapConfig.puzzleConfig;
        if (puzzleConfig == null || puzzleConfig.puzzlePoolIds == null || puzzleConfig.puzzlePoolIds.Count == 0)
        {
            Debug.LogWarning("[RandomPuzzleSpawn] puzzlePoolIds trống.");
            yield break;
        }

        int seed = ResolveRoomSeed(scopedSeedKey);
        var rng = new System.Random(seed);

        List<Transform> points = mapData.GetSpawnPointsByTag(puzzleSpawnTag);
        points.RemoveAll(p => p == null);

        if (points.Count == 0)
        {
            var fallback = GameObject.FindGameObjectsWithTag(puzzleSpawnTag);
            foreach (var go in fallback)
            {
                if (go != null) points.Add(go.transform);
            }
        }

        if (points.Count == 0)
        {
            Debug.LogWarning($"[RandomPuzzleSpawn] Không tìm thấy spawnpoint tag '{puzzleSpawnTag}'.");
            yield break;
        }

        List<string> validPuzzleIds = new List<string>();
        foreach (string puzzleId in puzzleConfig.puzzlePoolIds)
        {
            if (string.IsNullOrWhiteSpace(puzzleId)) continue;

            GameObject prefab = resourceDatabase.GetPrefabById(puzzleId);
            if (prefab == null) continue;

            validPuzzleIds.Add(puzzleId);
        }

        if (validPuzzleIds.Count == 0)
        {
            Debug.LogWarning("[RandomPuzzleSpawn] Không có puzzleId hợp lệ để spawn.");
            yield break;
        }

        ShuffleInPlace(points, rng);
        ShuffleInPlace(validPuzzleIds, rng);

        int spawnCount = Mathf.Min(points.Count, validPuzzleIds.Count);
        if (maxSpawnCountOverride > 0)
        {
            spawnCount = Mathf.Min(spawnCount, maxSpawnCountOverride);
        }

        int spawnedCount = 0;
        for (int i = 0; i < spawnCount; i++)
        {
            string puzzleId = validPuzzleIds[i];
            Transform point = points[i];
            GameObject prefab = resourceDatabase.GetPrefabById(puzzleId);

            if (prefab == null || point == null) continue;

            PhotonNetwork.InstantiateRoomObject(prefab.name, point.position, point.rotation);
            spawnedCount++;
            Debug.Log($"[RandomPuzzleSpawn] Spawn {puzzleId} ({prefab.name}) tại {point.name}");
        }

        if (spawnOnlyOncePerRoom && spawnedCount > 0)
        {
            PhotonNetwork.CurrentRoom.SetCustomProperties(new ExitGames.Client.Photon.Hashtable
            {
                { scopedSpawnedKey, true },
                { scopedSeedKey, seed }
            });
        }

        Debug.Log($"[RandomPuzzleSpawn] Hoàn tất: spawned={spawnedCount}/{spawnCount}, seed={seed}, scene={SceneManager.GetActiveScene().name}");
    }

    private int ResolveRoomSeed(string scopedSeedKey)
    {
        if (useFixedSeedForDebug)
        {
            return fixedSeed;
        }

        if (PhotonNetwork.CurrentRoom.CustomProperties.TryGetValue(scopedSeedKey, out object seedObj) && seedObj is int existingSeed)
        {
            return existingSeed;
        }

        int generatedSeed = DateTime.UtcNow.GetHashCode() ^ PhotonNetwork.CurrentRoom.Name.GetHashCode();
        PhotonNetwork.CurrentRoom.SetCustomProperties(new ExitGames.Client.Photon.Hashtable { { scopedSeedKey, generatedSeed } });
        return generatedSeed;
    }

    private string BuildScopedRoomKey(string baseKey, MapDataManager mapData)
    {
        string sceneName = SceneManager.GetActiveScene().name;
        string mapName = string.Empty;

        if (mapData != null && mapData.CurrentMapConfig != null && mapData.CurrentMapConfig.identityConfig != null)
        {
            mapName = mapData.CurrentMapConfig.identityConfig.mapId;

            if (string.IsNullOrWhiteSpace(mapName))
            {
                mapName = mapData.CurrentMapConfig.identityConfig.sceneName;
            }
        }

        if (string.IsNullOrWhiteSpace(mapName))
        {
            mapName = sceneName;
        }

        return $"{baseKey}_{mapName}";
    }

    private void DisableCorePuzzleSpawnerIfPresent()
    {
        Component coreSpawner = GetComponent("PuzzleSpawnerManager");
        if (coreSpawner is Behaviour behaviour)
        {
            behaviour.enabled = false;
            Debug.Log("[RandomPuzzleSpawn] Đã tắt PuzzleSpawnerManager (Core) trên cùng GameObject.");
        }
    }

    private void TryResolveResourceDatabase()
    {
        if (resourceDatabase != null) return;

        GameManager gameManager = FindObjectOfType<GameManager>();
        if (gameManager == null) return;

        FieldInfo field = typeof(GameManager).GetField("_resourceDB", BindingFlags.Instance | BindingFlags.NonPublic);
        if (field == null) return;

        resourceDatabase = field.GetValue(gameManager) as GameResourceDatabaseSO;
    }

    private static void ShuffleInPlace<T>(List<T> list, System.Random rng)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            T temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }
    }
}
