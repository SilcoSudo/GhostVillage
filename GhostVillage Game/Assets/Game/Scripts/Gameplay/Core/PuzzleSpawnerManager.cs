using UnityEngine;
using Photon.Pun;
using Game.Domain.Map.DTOs;

public class PuzzleSpawnerManager : MonoBehaviour
{
    public void SpawnPuzzles(PuzzleConfigDTO config, MapDataManager mapData)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        Debug.Log("[PuzzleSpawner] Setup câu đố...");

        // Logic spawn puzzle ở đây, dùng biến mapData để lấy vị trí
        // Ví dụ: mapData.GetSpawnPoint(...)
    }
}