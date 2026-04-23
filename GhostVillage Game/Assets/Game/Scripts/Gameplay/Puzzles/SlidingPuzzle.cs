using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using Game.Core.Interaction;
using Game.Scripts.Gameplay.Core;

// Bổ sung thêm namespace để gọi FPSController
using Game.Core.Player.RayCast; 

public class SlidingPuzzle : MonoBehaviourPunCallbacks, IPuzzleInteractTarget
{
    [Header("--- Spawning Settings ---")]
    [Tooltip("Tag của các điểm bạn muốn bàn xuất hiện")]
    [SerializeField] private string spawnPointTag = "SP_Talisman";
    [Tooltip("Tên của Prefab nằm trong thư mục Resources")]
    [SerializeField] private string puzzlePrefabName = "Puzzle_Talisman"; 
    
    [Header("--- Reward & Rules ---")]
    [Tooltip("Số lượng puzzle cần giải để hoàn thành")]
    [SerializeField] private int totalPuzzlesRequired = 3;
    [SerializeField] private KeyItemSO keyItemReward;

    private bool isFinished = false;
    private bool isCurrentlySolving = false;
    private bool isManager = false; 

    // [MỚI]: Khai báo biến giữ người chơi để khóa/mở
    private GameObject _localActor = null;
    private FPSController _cachedFpsController = null;
    private PlayerInteract _cachedPlayerInteract = null;

    void Start()
    {
        if (photonView.ViewID == 0) 
        {
            isManager = true;
            if (PhotonNetwork.IsMasterClient || !PhotonNetwork.IsConnectedAndReady)
            {
                SpawnPuzzleChain();
            }
            gameObject.SetActive(false); 
        }
    }

    private void SpawnPuzzleChain()
    {
        GameObject[] spawnPoints = GameObject.FindGameObjectsWithTag(spawnPointTag);
        if (spawnPoints.Length == 0) return;

        List<int> selectedIndices = new List<int>();
        int countToSpawn = Mathf.Min(totalPuzzlesRequired, spawnPoints.Length);

        while (selectedIndices.Count < countToSpawn)
        {
            int randomIndex = Random.Range(0, spawnPoints.Length);
            if (!selectedIndices.Contains(randomIndex)) selectedIndices.Add(randomIndex);
        }

        foreach (int index in selectedIndices)
        {
            Transform sp = spawnPoints[index].transform;
            if (PhotonNetwork.IsConnectedAndReady)
                PhotonNetwork.InstantiateRoomObject(puzzlePrefabName, sp.position, sp.rotation);
            else
                Instantiate(Resources.Load(puzzlePrefabName), sp.position, sp.rotation);
        }
    }

    public void Interact(GameObject actor)
    {
        if (isFinished || isCurrentlySolving || isManager) return;
        
        if (SlidingPuzzleUI.Instance != null)
        {
            isCurrentlySolving = true;
            
            // [MỚI]: Lưu người chơi lại và KHÓA di chuyển + NHẢ chuột ra
            _localActor = actor;
            LockPlayerControls(actor);

            SlidingPuzzleUI.Instance.OpenPuzzle(this);
        }
    }

    public string GetPromptMessage()
    {
        if (isManager) return ""; 
        if (isFinished) return "Completed ✓";
        return isCurrentlySolving ? "Solving..." : "[F] Solve Seal";
    }

    public void OnPlayerCanceled()
    {
        isCurrentlySolving = false;
        UnlockPlayerControls(); // [MỚI]: Tắt UI thì giấu chuột đi và cho đi lại bình thường
    }

    public void OnPuzzleSolvedLocal()
    {
        isCurrentlySolving = false;
        UnlockPlayerControls(); // [MỚI]: Giải xong cũng giấu chuột đi và cho đi lại bình thường
        
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(SubmitSolveRPC), RpcTarget.MasterClient);
        else
            ConfirmSolveRPC(true, 1);
    }

    [PunRPC]
    private void SubmitSolveRPC(PhotonMessageInfo info)
    {
        if (!PhotonNetwork.IsMasterClient) return;
        
        int currentSolved = 1;
        string propKey = "SlidingPuzzle_GlobalCount";
        
        if (PhotonNetwork.CurrentRoom.CustomProperties.TryGetValue(propKey, out object val))
            currentSolved = (int)val + 1;

        ExitGames.Client.Photon.Hashtable props = new ExitGames.Client.Photon.Hashtable { { propKey, currentSolved } };
        PhotonNetwork.CurrentRoom.SetCustomProperties(props);

        bool isFinal = currentSolved >= totalPuzzlesRequired;
        photonView.RPC(nameof(ConfirmSolveRPC), RpcTarget.AllBuffered, isFinal, currentSolved);
    }

    [PunRPC]
    private void ConfirmSolveRPC(bool isFinal, int currentSolved)
    {
        isFinished = true;
        GameplayEvents.OnPuzzleSolved?.Invoke();
        
        if (isFinal && PhotonNetwork.IsMasterClient && keyItemReward != null)
        {
            try {
                Vector3 dropPos = transform.position + Vector3.up * 1.5f;
                PhotonNetwork.InstantiateRoomObject(keyItemReward.itemWorldPrefab.name, dropPos, Quaternion.identity);
            } catch (System.Exception e) {
                Debug.LogError("[Sliding Puzzle] Lỗi đẻ đồ: " + e.Message);
            }
        }
    }

    // ==============================================================
    // [CÔNG NGHỆ KHÓA/MỞ PLAYER & QUẢN LÝ CHUỘT]
    // ==============================================================
    private void LockPlayerControls(GameObject a) 
    {
        _cachedFpsController = a.GetComponent<FPSController>(); 
        if (_cachedFpsController) {
            _cachedFpsController.isPlayingMinigame = true; // Khóa không cho đi lại
        }

        _cachedPlayerInteract = a.GetComponent<PlayerInteract>(); 
        if (_cachedPlayerInteract) {
            _cachedPlayerInteract.enabled = false;
        }
        
        // TRẢ CHUỘT LẠI CHO UI
        Cursor.lockState = CursorLockMode.None; 
        Cursor.visible = true; 
    }
    
    private void UnlockPlayerControls() 
    {
        if (_cachedFpsController == null && _localActor != null) {
            _cachedFpsController = _localActor.GetComponent<FPSController>();
        }

        if (_cachedFpsController != null) {
            _cachedFpsController.isPlayingMinigame = false; // Mở khóa di chuyển
        }

        if (_cachedPlayerInteract == null && _localActor != null) {
            _cachedPlayerInteract = _localActor.GetComponent<PlayerInteract>();
        }

        if (_cachedPlayerInteract != null) {
            _cachedPlayerInteract.enabled = true;
        }
        
        // GIẤU CHUỘT ĐI VÀ KHÓA VÀO GIỮA MÀN HÌNH NHƯ CŨ
        Cursor.lockState = CursorLockMode.Locked; 
        Cursor.visible = false; 
    }
}