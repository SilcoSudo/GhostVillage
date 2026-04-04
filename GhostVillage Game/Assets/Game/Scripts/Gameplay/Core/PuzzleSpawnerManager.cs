using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;
using System.Collections.Generic;
using System.Linq;
using Game.Core.Database;

public class PuzzleSpawnerManager : MonoBehaviour
{
    public void SpawnPuzzles(PuzzleConfigDTO config, MapDataManager mapData, GameResourceDatabaseSO resourceDB)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        if (config == null || config.puzzlePoolIds == null || config.puzzlePoolIds.Count == 0)
        {
            Debug.LogWarning("⚠️ [PuzzleSpawner] Map này không có Puzzle hoặc thiếu config Puzzle.");
            return;
        }

        // BỐC LIST ĐIỂM TỪ TAG SP_Puzzle
        List<Transform> availablePoints = mapData.GetSpawnPointsByTag("SP_Puzzle");
        if (availablePoints.Count == 0)
        {
            Debug.LogWarning("⚠️ [PuzzleSpawner] Map không có điểm nào gắn Tag 'SP_Puzzle'!");
            return;
        }

        Debug.Log($"[PuzzleSpawner] Đang setup {config.puzzlePoolIds.Count} câu đố...");

        List<Transform> shuffledPoints = availablePoints.OrderBy(x => Random.value).ToList();
        int spawnCount = Mathf.Min(config.puzzlePoolIds.Count, shuffledPoints.Count);

        for (int i = 0; i < spawnCount; i++)
        {
            string puzzlePrefabId = config.puzzlePoolIds[i];
            Transform targetPoint = shuffledPoints[i];

            if (string.IsNullOrEmpty(puzzlePrefabId)) continue;

            GameObject prefab = resourceDB.GetPrefabById(puzzlePrefabId);

            if (prefab != null)
            {
                PhotonNetwork.InstantiateRoomObject(prefab.name, targetPoint.position, targetPoint.rotation);
                Debug.Log($" [PuzzleSpawner] Spawn {puzzlePrefabId} ({prefab.name}) tại {targetPoint.name}");
            }
        }
    }
}