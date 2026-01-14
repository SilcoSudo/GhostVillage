using UnityEngine;
using Photon.Pun;
using VContainer;
using Game.Script.UI;
using Cysharp.Threading.Tasks; // Để gọi GlobalUIManager

namespace Game.Core.Lobby
{
    public class LobbyManager : MonoBehaviour
    {
        [Header("Setup")]
        [SerializeField] private string _playerPrefabName = "PlayerCharacter"; // Tên Prefab trong thư mục Resources
        [SerializeField] private Transform _spawnPoint; // Vị trí sinh ra trên Terrain

        // Inject GlobalUIManager để tắt loading
        [Inject] private GlobalUIManager _globalUI;

        // ✅ BEST PRACTICE: Dùng async void Start với UniTask
        // Không cần [System.Obsolete] nữa
        [System.Obsolete]
        private async void Start()
        {
            // 1. Đợi 1 frame để Unity ổn định Scene và UI
            await UniTask.Yield(PlayerLoopTiming.Update);

            // 2. Tắt Loading
            if (_globalUI != null)
            {
                Debug.Log("✅ [LobbyManager] Scene Ready. Tắt Loading.");
                _globalUI.ShowLoading(false);
            }
            else
            {
                // Fallback: Tìm thủ công nếu quên tạo Scope
                var manualUI = FindObjectOfType<GlobalUIManager>();
                if (manualUI != null) manualUI.ShowLoading(false);
            }

            // 3. Sinh nhân vật
            SpawnPlayer();
        }

        private void SpawnPlayer()
        {
            if (PhotonNetwork.IsConnected)
            {
                Vector3 randomPos = _spawnPoint.position + new Vector3(Random.Range(-2f, 2f), 0, Random.Range(-2f, 2f));

                Debug.Log($"👾 [LobbyManager] Spawning Player: {randomPos}");
                PhotonNetwork.Instantiate(_playerPrefabName, randomPos, Quaternion.identity);
            }
            else
            {
                Debug.LogWarning("⚠️ [LobbyManager] Mất kết nối Photon! Không thể spawn.");
            }
        }
    }
}