using UnityEngine;
using Photon.Pun;
using GhostVillage.Gameplay.Monsters.VongNhi;
using Game.Scripts.Gameplay.Core;
using Game.Core.Player.RayCast;

public class KeoCoPuzzle : MonoBehaviourPun, IPuzzleInteractTarget
{
    [Header("--- Reward ---")]
    public KeyItemSO keyItemReward;
    public Transform rewardDropPoint;

    [Header("--- Vong Nhi ---")]
    [SerializeField] private VongNhiMonster vongNhi;
    [SerializeField] private string vongNhiTag = "VongNhi";

    [Header("--- Player Control ---")]
    [SerializeField] private bool showCursorDuringMinigame = false;

    [Header("--- Balance System (Sudden Death) ---")]
    public float pointsPerCorrectPress = 5.0f;
    public float penaltyPerWrongPress = 0.75f;
    public float[] targetScores = { 20f, 35f, 45f, 50f };
    public float[] dropPerSeconds = { 2f, 4f, 5f, 5.5f };

    private bool _isSolved = false;
    private bool _isMatchActive = false;
    private int _playersPullingCount = 0; 
    private float _currentScore = 0f; 
    
    private GameObject _localActor = null;
    private FPSController _cachedFpsController = null;
    private PlayerInteract _cachedPlayerInteract = null;

    public float GetTargetScore() {
        int pCount = Mathf.Clamp(PhotonNetwork.IsConnectedAndReady ? PhotonNetwork.CurrentRoom.PlayerCount : 1, 1, 4);
        return targetScores[pCount - 1]; 
    }

    public float GetDropPerSecond() {
        int pCount = Mathf.Clamp(PhotonNetwork.IsConnectedAndReady ? PhotonNetwork.CurrentRoom.PlayerCount : 1, 1, 4);
        return dropPerSeconds[pCount - 1];
    }

    public string GetPromptMessage() {
        if (_isSolved) return "Solved ✓";
        return _playersPullingCount > 0 ? "Teammate pulling! Help! (F)" : "Tương tác";
    }

    public void Interact(GameObject actor) {
        if (_isSolved || KeoCoPuzzleUI.Instance == null) return; 
        
        PhotonView pv = actor.GetComponent<PhotonView>();
        if (pv == null || !pv.IsMine) return;

        _localActor = actor;
        LockPlayerControls(actor);

        if (PhotonNetwork.IsConnectedAndReady) photonView.RPC(nameof(PlayerJoinRPC), RpcTarget.AllBuffered);
        else PlayerJoinRPC();

        KeoCoPuzzleUI.Instance.OpenPuzzle(this);

        int actorNum = pv.Owner?.ActorNumber ?? -1;
        if (PhotonNetwork.IsConnectedAndReady) photonView.RPC(nameof(StartKeoCoRPC), RpcTarget.All, actorNum);
        else StartKeoCoRPC(actorNum);
    }

    public void CancelMinigameLocal() {
        UnlockPlayerControls();
        _localActor = null;
        if (PhotonNetwork.IsConnectedAndReady) photonView.RPC(nameof(PlayerLeaveRPC), RpcTarget.AllBuffered);
        else PlayerLeaveRPC();
    }

    public void SubmitPull(bool isCorrect) {
        if (!_isMatchActive) return;
        float change = isCorrect ? pointsPerCorrectPress : -penaltyPerWrongPress;
        if (PhotonNetwork.IsConnectedAndReady) photonView.RPC(nameof(ApplyScoreRPC), RpcTarget.MasterClient, change);
        else ApplyScoreRPC(change);
    }

    private void Update() {
        if (PhotonNetwork.IsMasterClient && _isMatchActive) {
            float target = GetTargetScore();
            _currentScore -= GetDropPerSecond() * Time.deltaTime;

            if (_currentScore >= target) photonView.RPC(nameof(EndMatchRPC), RpcTarget.AllBuffered, true);
            else if (_currentScore <= -target) photonView.RPC(nameof(EndMatchRPC), RpcTarget.AllBuffered, false);
            else photonView.RPC(nameof(SyncScoreRPC), RpcTarget.Others, _currentScore, target);
        }
    }

    [PunRPC]
    private void ApplyScoreRPC(float amount) {
        if (!_isMatchActive) return;
        _currentScore += amount;
        photonView.RPC(nameof(SyncScoreRPC), RpcTarget.All, _currentScore, GetTargetScore());
    }

    [PunRPC]
    private void SyncScoreRPC(float score, float targetScore) {
        _currentScore = score;
        if (KeoCoPuzzleUI.Instance != null && KeoCoPuzzleUI.Instance.CurrentPuzzle == this)
            KeoCoPuzzleUI.Instance.UpdateNetworkState(_currentScore, targetScore);
    }

    [PunRPC] private void StartMatchRPC() { _isMatchActive = true; _currentScore = 0f; }

    [PunRPC]
    private void EndMatchRPC(bool teamWon) {
        _isMatchActive = false;

        // [MỞ KHÓA NGAY LẬP TỨC KHÔNG CHỜ UI]
        if (_localActor != null) {
            UnlockPlayerControls();
        }

        if (KeoCoPuzzleUI.Instance != null && KeoCoPuzzleUI.Instance.CurrentPuzzle == this)
            KeoCoPuzzleUI.Instance.ShowResult(teamWon ? "THE SPIRIT RETREATS" : "DEFEAT!");

        if (teamWon) {
            if (PhotonNetwork.IsMasterClient) {
                photonView.RPC(nameof(DisablePuzzleRPC), RpcTarget.AllBuffered);
                
                try {
                    if (keyItemReward != null && keyItemReward.itemWorldPrefab != null) {
                        Vector3 pos = (rewardDropPoint != null) ? rewardDropPoint.position : transform.position + Vector3.up * 1.5f;
                        PhotonNetwork.InstantiateRoomObject(keyItemReward.itemWorldPrefab.name, pos, Quaternion.identity);
                    }
                } catch (System.Exception e) {
                    Debug.LogError("[Spawn Error] Lỗi mạng đẻ đồ: " + e.Message);
                }
                
                photonView.RPC(nameof(VongNhiLoseRPC), RpcTarget.AllBuffered);
            }
            GameplayEvents.OnPuzzleSolved?.Invoke();
        } else if (PhotonNetwork.IsMasterClient) {
            photonView.RPC(nameof(VongNhiWinRPC), RpcTarget.AllBuffered);
            Invoke(nameof(ResetMatchState), 3f);
        }
    }

    private void ResetMatchState() => _currentScore = 0f;

    [PunRPC] private void PlayerJoinRPC() { 
        _playersPullingCount++; 
        if (_playersPullingCount == 1 && PhotonNetwork.IsMasterClient && !_isMatchActive) 
            photonView.RPC(nameof(StartMatchRPC), RpcTarget.AllBuffered); 
    }

    [PunRPC] private void PlayerLeaveRPC() { 
        _playersPullingCount--; 
        if (_playersPullingCount <= 0 && PhotonNetwork.IsMasterClient) {
            _isMatchActive = false; 
            photonView.RPC(nameof(VongNhiCancelRPC), RpcTarget.AllBuffered);
        }
    }

    [PunRPC] private void DisablePuzzleRPC() { _isSolved = true; if (GetComponent<Collider>()) GetComponent<Collider>().enabled = false; }
    [PunRPC] private void VongNhiLoseRPC() { vongNhi?.LoseKeoCo(); }
    [PunRPC] private void VongNhiWinRPC() { vongNhi?.WinKeoCo(); }
    [PunRPC] private void VongNhiCancelRPC() { vongNhi?.CancelKeoCo(); ResetMatchState(); }

    [PunRPC]
    private void StartKeoCoRPC(int playerActorNumber) {
        TryResolveVongNhi();
        if (vongNhi == null) return;
        Transform playerTf = _localActor != null ? _localActor.transform : transform;
        SnapVongNhiToPullPoint(playerTf);
        vongNhi.EnterKeoCo(playerTf);
    }

    private void TryResolveVongNhi() {
        if (vongNhi != null) return;
        GameObject[] all = GameObject.FindGameObjectsWithTag(vongNhiTag);
        if (all.Length == 0) return;
        float minDist = float.MaxValue;
        foreach (GameObject vn in all) {
            float d = Vector3.Distance(transform.position, vn.transform.position);
            if (d < minDist) { minDist = d; vongNhi = vn.GetComponent<VongNhiMonster>(); }
        }
    }

    private void SnapVongNhiToPullPoint(Transform playerTf) {
        if (vongNhi == null) return;
        
        if (playerTf != null) {
            Vector3 dir = playerTf.position - vongNhi.transform.position; 
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.01f) {
                vongNhi.transform.rotation = Quaternion.LookRotation(dir.normalized);
            }
        }
    }

    private void LockPlayerControls(GameObject a) {
        _cachedFpsController = a.GetComponent<FPSController>(); 
        if (_cachedFpsController) {
            // [SỬA LỖI]: Tuyệt đối KHÔNG tắt component nữa, chỉ bật cờ isPlayingMinigame
            _cachedFpsController.isPlayingMinigame = true; 
        }

        _cachedPlayerInteract = a.GetComponent<PlayerInteract>(); 
        if (_cachedPlayerInteract) {
            _cachedPlayerInteract.enabled = false;
        }
        
        Cursor.lockState = showCursorDuringMinigame ? CursorLockMode.None : CursorLockMode.Locked; 
        Cursor.visible = showCursorDuringMinigame;
    }
    
    private void UnlockPlayerControls() {
        if (_cachedFpsController == null && _localActor != null) {
            _cachedFpsController = _localActor.GetComponent<FPSController>();
        }

        if (_cachedFpsController != null) {
            Debug.Log("<color=green>[KeoCo] ĐÃ KÍCH HOẠT LỆNH MỞ KHÓA DI CHUYỂN!</color>");
            // [MỞ KHÓA]: Trả lại quyền di chuyển cho sếp
            _cachedFpsController.isPlayingMinigame = false; 

            // Ép bật lại component đề phòng trước đó sếp lỡ tắt thủ công
            if (!_cachedFpsController.enabled) _cachedFpsController.enabled = true;
        } else {
            Debug.LogError("<color=red>[KeoCo] LỖI: Không tìm thấy FPSController để mở khóa!</color>");
        }

        if (_cachedPlayerInteract == null && _localActor != null) {
            _cachedPlayerInteract = _localActor.GetComponent<PlayerInteract>();
        }

        if (_cachedPlayerInteract != null) {
            _cachedPlayerInteract.enabled = true;
        }
        
        Cursor.lockState = CursorLockMode.Locked; 
        Cursor.visible = false;
    }
}