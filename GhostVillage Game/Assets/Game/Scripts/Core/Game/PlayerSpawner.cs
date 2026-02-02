using Photon.Pun;
using UnityEngine;

public class PlayerSpawner : MonoBehaviour
{
    // Tạo Singleton để GameManager dễ gọi
    public static PlayerSpawner Instance;

    [Header("Settings")]
    public string playerPrefabName = "Player"; // Tên file trong thư mục Resources
    public Transform[] spawnPoints;

    private void Awake()
    {
        Instance = this;
    }

    public void SpawnLocalPlayer()
    {
        if (PhotonNetwork.IsConnectedAndReady)
        {
            // Logic chia vị trí: Lấy số dư để đảm bảo luôn nằm trong mảng (0, 1, 2, 3)
            // Ví dụ: ActorNumber 1 -> index 0, ActorNumber 5 -> index 0
            int spawnIndex = (PhotonNetwork.LocalPlayer.ActorNumber - 1) % spawnPoints.Length;
            Transform point = spawnPoints[spawnIndex];

            // Instiate qua mạng
            PhotonNetwork.Instantiate(
                playerPrefabName,
                point.position,
                point.rotation
            );

            Debug.Log($"[Spawner] Đã spawn Player tại điểm số {spawnIndex}");
        }
        else
        {
            Debug.LogError("[Spawner] Chưa kết nối Photon, không spawn được!");
        }
    }
}