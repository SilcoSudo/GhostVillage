using UnityEngine;
using Photon.Pun;
using VContainer;
using Game.Script.UI; // Để gọi GlobalUIManager

namespace Game.Core.Lobby
{
    public class LobbyManager : MonoBehaviour
    {
        [Header("Setup")]
        [SerializeField] private string _playerPrefabName = "PlayerCharacter"; // Tên Prefab trong thư mục Resources
        [SerializeField] private Transform _spawnPoint; // Vị trí sinh ra trên Terrain

        // Inject GlobalUIManager để tắt loading
        [Inject] private GlobalUIManager _globalUI;

        [System.Obsolete]
        private void Start()
        {
            // 1. TẮT LOADING SCREEN (Quan trọng nhất để hết bị treo màn hình)
            if (_globalUI != null)
            {
                Debug.Log("✅ Đã vào Lobby Map. Tắt Loading...");
                _globalUI.ShowLoading(false);
            }

            else
            {
                // Fallback nếu quên tạo Scope
                Debug.LogWarning("⚠️ GlobalUI null! Kiểm tra xem đã tạo LobbyGameLifetimeScope chưa?");
                var manualUI = FindObjectOfType<GlobalUIManager>();
                if (manualUI != null) manualUI.ShowLoading(false);
            }

            // 2. Spawn Nhân Vật
            if (PhotonNetwork.IsConnected)
            {
                // Random nhẹ vị trí để không đè nhau
                Vector3 randomPos = _spawnPoint.position + new Vector3(Random.Range(-2f, 2f), 0, Random.Range(-2f, 2f));

                Debug.Log($"🚀 Spawning Player tại: {randomPos}");
                PhotonNetwork.Instantiate(_playerPrefabName, randomPos, Quaternion.identity);
            }
        }
    }
}