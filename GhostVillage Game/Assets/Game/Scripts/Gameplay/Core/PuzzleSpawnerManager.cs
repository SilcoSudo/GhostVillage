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

        // [FIX CHÍNH LÀ Ở ĐÂY]: Kiểm tra cả trường hợp config bị null và các List bên trong bị null
        if (config == null ||
            config.puzzlePoolIds == null || config.puzzlePoolIds.Count == 0 ||
            config.spawnPointIds == null || config.spawnPointIds.Count == 0)
        {
            Debug.LogWarning("⚠️ [PuzzleSpawner] Map này không có Puzzle hoặc thiếu config Puzzle.");
            return;
        }

        Debug.Log($"[PuzzleSpawner] Đang setup {config.puzzlePoolIds.Count} câu đố...");

        List<string> shuffledPoints = config.spawnPointIds.OrderBy(x => Random.value).ToList();
        int spawnCount = Mathf.Min(config.puzzlePoolIds.Count, shuffledPoints.Count);

        for (int i = 0; i < spawnCount; i++)
        {
            string puzzlePrefabId = config.puzzlePoolIds[i];
            string pointId = shuffledPoints[i];

            Transform targetPoint = mapData.GetSpawnPointById(pointId);

            // Check nếu ID rỗng thì bỏ qua
            if (string.IsNullOrEmpty(puzzlePrefabId)) continue;

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