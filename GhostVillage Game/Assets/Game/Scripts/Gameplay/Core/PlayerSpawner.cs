using System.Collections.Generic;
using Photon.Pun;
using UnityEngine;
using VContainer;
using VContainer.Unity;

public class PlayerSpawner : MonoBehaviour
{
    [Header("Settings")]
    public string playerPrefabName = "Player";

    [Inject] private IObjectResolver _resolver;

    public void SpawnLocalPlayer(MapDataManager mapData)
    {
        // 1. Xin danh sách điểm spawn người chơi từ MapData
        List<Transform> spawnPoints = mapData.GetSpawnPointsByTag("SP_Player");

        if (PhotonNetwork.IsConnectedAndReady && spawnPoints.Count > 0)
        {
            // 2. Chia vị trí dựa trên ActorNumber (Tránh đè lên nhau)
            int spawnIndex = (PhotonNetwork.LocalPlayer.ActorNumber - 1) % spawnPoints.Count;
            Transform point = spawnPoints[spawnIndex];

            // 3. Instantiate qua mạng (Hứng lấy GameObject trả về)
            GameObject playerObj = PhotonNetwork.Instantiate(
                playerPrefabName,
                point.position,
                point.rotation
            );

            // 4. TIÊM VCONTAINER NGAY LẬP TỨC VÀO PLAYER
            if (playerObj != null && _resolver != null)
            {
                _resolver.InjectGameObject(playerObj);
                Debug.Log($"<color=green>[Spawner]</color> Đã spawn & Inject Player tại: {point.name}");
            }
        }
        else
        {
            Debug.LogError("[Spawner] Không thể spawn! Kiểm tra kết nối Photon hoặc Tag 'SP_Player'");
        }
    }
}