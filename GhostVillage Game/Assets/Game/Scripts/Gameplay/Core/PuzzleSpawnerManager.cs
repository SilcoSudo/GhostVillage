using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;
using System.Linq;
using Game.Core.Database; // Thêm namespace này

public class PuzzleSpawnerManager : MonoBehaviour
{
    public void SpawnPuzzles(PuzzleConfigDTO config, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (!PhotonNetwork.IsMasterClient) return;
        if (config == null || config.puzzlePoolIds.Count == 0 || config.spawnPointIds.Count == 0) return;

        Debug.Log($"[PuzzleSpawner] Đang setup {config.puzzlePoolIds.Count} câu đố...");

        List<string> shuffledPoints = config.spawnPointIds.OrderBy(x => Random.value).ToList();
        int spawnCount = Mathf.Min(config.puzzlePoolIds.Count, shuffledPoints.Count);

        for (int i = 0; i < spawnCount; i++)
        {
            string puzzlePrefabId = config.puzzlePoolIds[i];
            string pointId = shuffledPoints[i];

            Transform targetPoint = mapData.GetSpawnPointById(pointId);
            GameObject prefab = resourceDB.GetPrefabById(puzzlePrefabId);

            if (targetPoint != null && prefab != null)
            {
                // Truyền tên Prefab vào cho Photon
                PhotonNetwork.InstantiateRoomObject(prefab.name, targetPoint.position, targetPoint.rotation);
                Debug.Log($"✅ [PuzzleSpawner] Spawn {puzzlePrefabId} ({prefab.name}) tại {pointId}");
            }
        }
    }
}