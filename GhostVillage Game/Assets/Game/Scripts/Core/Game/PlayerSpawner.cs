using Photon.Pun;
using UnityEngine;

public class PlayerSpawner : MonoBehaviour
{
    public GameObject playerPrefab;
    public Transform[] spawnPoints; // set 4 empty object này trong Inspector

    void Start()
    {
        if (PhotonNetwork.IsConnectedAndReady)
        {
            int playerIndex = PhotonNetwork.LocalPlayer.ActorNumber - 1;
            // ActorNumber bắt đầu từ 1,2,3,4...

            if (playerIndex < spawnPoints.Length)
            {
                Transform spawnPoint = spawnPoints[playerIndex];
                PhotonNetwork.Instantiate(
                    playerPrefab.name,
                    spawnPoint.position,
                    spawnPoint.rotation
                );
            }
            else
            {
                Debug.LogWarning("Không đủ spawn point cho số lượng player!");
            }
        }
    }
}
