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
        [SerializeField] private string _playerPrefabName = "PlayerCharacter";
        [SerializeField] private Transform _spawnPoint;

        [Inject] private GlobalUIManager _globalUI;

        // ✅ BEST PRACTICE: Dùng async void Start với UniTask
        // Không cần [System.Obsolete] nữa
        [System.Obsolete]
        private async void Start()
        {
            // 1. Đợi 1 frame để Unity ổn định Scene và UI
            await UniTask.Yield(PlayerLoopTiming.Update);

            // 2. Tắt Loading
            if (_globalUI != null) _globalUI.ShowLoading(false);

            // 3. ĐỢI CHO ĐẾN KHI THỰC SỰ VÀO PHÒNG
            // Đây là chìa khóa để sửa lỗi RaiseEvent(202)
            await WaitForInRoom();

            // 4. Sinh nhân vật
            SpawnPlayer();
        }

        private async UniTask WaitForInRoom()
        {
            float timeout = 5f; // Giới hạn đợi 5 giây
            float timer = 0;

            while (!PhotonNetwork.InRoom && timer < timeout)
            {
                timer += Time.deltaTime;
                await UniTask.Yield();
            }

            if (!PhotonNetwork.InRoom)
            {
                Debug.LogError("❌ [LobbyManager] Quá thời gian chờ vào phòng. Kiểm tra kết nối!");
            }
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