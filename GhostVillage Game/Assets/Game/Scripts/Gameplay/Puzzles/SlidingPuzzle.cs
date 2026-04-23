using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;
using Game.Core.Interaction;
using Game.Scripts.Gameplay.Core;

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
            SlidingPuzzleUI.Instance.OpenPuzzle(this);
        }
    }

    public string GetPromptMessage()
    {
        if (isManager) return "";
        if (isFinished) return "Completed ✓";
        // [CẬP NHẬT]: Đã đổi sang phím F
        return isCurrentlySolving ? "Solving..." : "[F] Solve Seal";
    }

    public void OnPlayerCanceled() { isCurrentlySolving = false; }

    public void OnPuzzleSolvedLocal()
    {
        isCurrentlySolving = false;
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
            Vector3 dropPos = transform.position + Vector3.up * 1f;
            PhotonNetwork.InstantiateRoomObject(keyItemReward.itemWorldPrefab.name, dropPos, Quaternion.identity);
        }
    }
}