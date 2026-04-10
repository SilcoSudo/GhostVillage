using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;
using Game.Scripts.Gameplay.Core;
using VContainer;

namespace Game.Scripts.Gameplay.Puzzles.Map2
{
    [System.Serializable]
    public class OngHaiHint
    {
        [TextArea(2, 4)]
        public string hintText;
        [Tooltip("Kéo thả 3 cái Scriptable Object Búa, Kìm, Cờ Lê vào đây theo thứ tự đúng")]
        public List<ItemDataSO> correctItemOrder;
    }

    [RequireComponent(typeof(PhotonView))]
    public class OngHaiPuzzleManager : MonoBehaviourPun
    {
        [Header("Item Spawning (3 món đồ nghề)")]
        public string hammerPrefabName = "World_Hammer";
        public string pliersPrefabName = "World_Pliers";
        public string wrenchPrefabName = "World_Wrench";

        [Tooltip("Kéo 10 vị trí rỗng quanh lán Ông Hai vào đây")]
        public List<Transform> randomSpawnPoints;

        [Header("Puzzle Settings")]
        public List<OngHaiHint> hintDatabase = new List<OngHaiHint>();

        [Header("Reward")]
        public Transform oarBladeSpawnPoint;
        public string oarBladePrefabName = "World_OarBlade";

        [Header("Audio References")]
        public AudioSource tableAudioSource;

        [Header("Item Database (Cho Puzzle này)")]
        public List<ItemDataSO> allowedItems;

        [Inject] private GameAudioManager _audioManager;

        // --- Biến đồng bộ mạng ---
        private List<string> _winningSequenceIDs = new List<string>();
        private string _activeHintText = "Đang tìm manh mối...";
        private string[] _currentSlots = new string[3] { "", "", "" };
        private bool _isSolved = false;

        private void Start()
        {
            if (_audioManager == null)
            {
                _audioManager = Object.FindFirstObjectByType<GameAudioManager>(FindObjectsInactive.Include);
            }

            if (PhotonNetwork.IsMasterClient)
            {
                SetupPuzzle();
            }
        }

        public ItemDataSO GetItemDataByID(string id)
        {
            return allowedItems.Find(item => item.itemId == id);
        }

        private void SetupPuzzle()
        {
            if (randomSpawnPoints.Count >= 3)
            {
                List<Transform> shuffledPoints = randomSpawnPoints.OrderBy(x => Random.value).ToList();

                PhotonNetwork.InstantiateRoomObject(hammerPrefabName, shuffledPoints[0].position, shuffledPoints[0].rotation);
                PhotonNetwork.InstantiateRoomObject(pliersPrefabName, shuffledPoints[1].position, shuffledPoints[1].rotation);
                PhotonNetwork.InstantiateRoomObject(wrenchPrefabName, shuffledPoints[2].position, shuffledPoints[2].rotation);

                Debug.Log("<color=cyan>[Ông Hai Puzzle] Đã rải xong 3 món đồ nghề ra map!</color>");
            }
            else
            {
                Debug.LogError("[Ông Hai Puzzle] Lỗi: Chưa kéo đủ 3 điểm Spawn kìa sếp!");
            }

            // KIỂM TRA XEM SẾP CÓ ĐIỀN HINT CHƯA
            if (hintDatabase == null || hintDatabase.Count == 0)
            {
                Debug.LogError("<color=red>[Ông Hai Puzzle] BÁO ĐỘNG: Sếp chưa add cái Hint nào vào list 'Hint Database' ở Inspector kìa!</color>");
                return;
            }

            int hintIndex = Random.Range(0, hintDatabase.Count);
            var selectedHint = hintDatabase[hintIndex];

            if (selectedHint.correctItemOrder == null || selectedHint.correctItemOrder.Count < 3)
            {
                Debug.LogError($"<color=red>[Ông Hai Puzzle] BÁO ĐỘNG: Hint số {hintIndex} chưa được kéo đủ 3 món SO vào mục 'Correct Item Order'!</color>");
                return;
            }

            string[] correctIDs = new string[3];
            for (int i = 0; i < 3; i++)
            {
                correctIDs[i] = selectedHint.correctItemOrder[i].itemId;
            }

            photonView.RPC(nameof(SyncPuzzleConfigRPC), RpcTarget.AllBuffered, selectedHint.hintText, correctIDs);
        }

        [PunRPC]
        private void SyncPuzzleConfigRPC(string hint, string[] correctIDs)
        {
            _activeHintText = hint;
            _winningSequenceIDs = new List<string>(correctIDs);

            Debug.Log($"<color=yellow>====== [ÔNG HAI PUZZLE LOG] ======</color>\n" +
                      $"Đã bốc trúng Hint: {_activeHintText}\n" +
                      $"Thứ tự đúng của ván này là: [{correctIDs[0]}] -> [{correctIDs[1]}] -> [{correctIDs[2]}]");
        }

        public string GetActiveHint() => _activeHintText;

        public void UpdateSlotStatus(int slotIndex, string itemID)
        {
            _currentSlots[slotIndex] = itemID;

            if (!string.IsNullOrEmpty(_currentSlots[0]) &&
                !string.IsNullOrEmpty(_currentSlots[1]) &&
                !string.IsNullOrEmpty(_currentSlots[2]))
            {
                CheckResult();
            }
        }

        private void CheckResult()
        {
            if (_isSolved) return;

            // BẢO VỆ: Tránh lỗi ArgumentOutOfRangeException
            if (_winningSequenceIDs == null || _winningSequenceIDs.Count < 3)
            {
                Debug.LogError("<color=red>[Ông Hai Puzzle] LỖI NẶNG: Không có đáp án để chấm điểm! Check lại Inspector!</color>");
                return;
            }

            // LOG KIỂM TRA ĐỐI CHIẾU
            Debug.Log($"<color=magenta>--- [CHẤM ĐIỂM ÔNG HAI] ---</color>\n" +
                      $"Sếp vừa cắm: [{_currentSlots[0]}] - [{_currentSlots[1]}] - [{_currentSlots[2]}]\n" +
                      $"Đáp án ĐÚNG: [{_winningSequenceIDs[0]}] - [{_winningSequenceIDs[1]}] - [{_winningSequenceIDs[2]}]");

            bool isCorrect = true;
            for (int i = 0; i < 3; i++)
            {
                if (_currentSlots[i] != _winningSequenceIDs[i])
                {
                    isCorrect = false;
                    break;
                }
            }

            if (isCorrect)
            {
                photonView.RPC(nameof(OnPuzzleSolvedRPC), RpcTarget.AllBuffered);
            }
            else
            {
                photonView.RPC(nameof(OnPuzzleFailedRPC), RpcTarget.All);
            }
        }

        [PunRPC]
        private void OnPuzzleSolvedRPC()
        {
            _isSolved = true;
            Debug.Log("<color=green>[Ông Hai Puzzle] GIẢI ĐÚNG RỒI! Bàn mở ngăn kéo lòi Mái Chèo ra!</color>");

            if (_audioManager != null && tableAudioSource != null)
            {
                AudioClip unlockClip = _audioManager.GetClip("SAFE_UNLOCK");
                if (unlockClip != null) tableAudioSource.PlayOneShot(unlockClip);
            }

            if (PhotonNetwork.IsMasterClient)
            {
                PhotonNetwork.InstantiateRoomObject(oarBladePrefabName, oarBladeSpawnPoint.position, oarBladeSpawnPoint.rotation);

                // [MỚI THÊM]: Hú còi cho thằng UniversalObjectiveManager biết là đã xong 1 việc
                GameplayEvents.OnPuzzleSolved?.Invoke();
            }
        }

        [PunRPC]
        private void OnPuzzleFailedRPC()
        {
            Debug.Log("<color=red>[Ông Hai Puzzle] SAI THỨ TỰ RỒI! Bàn kẹt chốt, hú còi gọi Ma Da!</color>");

            if (_audioManager != null && tableAudioSource != null)
            {
                AudioClip alarmClip = _audioManager.GetClip("ALARM_SIREN");
                if (alarmClip != null) tableAudioSource.PlayOneShot(alarmClip);
            }

            GameplayEvents.OnWrongPuzzlePenalty?.Invoke(transform.position);
        }
    }
}