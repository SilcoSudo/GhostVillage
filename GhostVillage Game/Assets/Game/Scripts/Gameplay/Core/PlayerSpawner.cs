using System.Collections.Generic;
using Photon.Pun;
using UnityEngine;

public class PlayerSpawner : MonoBehaviour
{

    [Header("Settings")]
    public string playerPrefabName = "Player";


    public void SpawnLocalPlayer(MapDataManager mapData)
    {
        // 1. Xin danh sách điểm spawn người chơi từ MapData
        List<Transform> spawnPoints = mapData.GetSpawnPointsByTag("SP_Player");

        if (PhotonNetwork.IsConnectedAndReady && spawnPoints.Count > 0)
        {
            // 2. Chia vị trí dựa trên ActorNumber (Tránh đè lên nhau)
            int spawnIndex = (PhotonNetwork.LocalPlayer.ActorNumber - 1) % spawnPoints.Count;
            Transform point = spawnPoints[spawnIndex];

            // 3. Instantiate qua mạng
            PhotonNetwork.Instantiate(
                playerPrefabName,
                point.position,
                point.rotation
            );

            Debug.Log($"<color=green>[Spawner]</color> Đã spawn Player tại điểm: {point.name}");
        }
        else
        {
            Debug.LogError("[Spawner] Không thể spawn! Kiểm tra kết nối Photon hoặc Tag 'SP_Player'");
        }
    }
}