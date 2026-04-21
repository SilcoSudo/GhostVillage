using UnityEngine;
using Photon.Pun;
using System.Collections.Generic;

public class SafeBoxInteractable : MonoBehaviourPun, IInteractable
{
    [Header("Puzzle Reference")]
    public FishPoolPuzzleManager puzzleManager;

    [Tooltip("Optional. It will automatically search for the SafeBoxUI in the Canvas HUD if left empty.")]
    public SafeBoxUI safeBoxUI;

    [Header("Reward Spawning")]
    [Tooltip("Empty GameObject placed in front of the safe to spawn the Spark Plug.")]
    public Transform itemSpawnPoint;
    public string itemPrefabName = "World_Bugi"; // The prefab file name of the Spark Plug in the Resources folder

    private bool _isOpened = false;

    private void Start()
    {
        // Automatically find the SafeBox UI in the background
        if (safeBoxUI == null)
        {
            safeBoxUI = Object.FindFirstObjectByType<SafeBoxUI>(FindObjectsInactive.Include);

            // ADD UI SEARCH LOG CHECK
            if (safeBoxUI != null)
            {
                Debug.Log($"<color=green>[SafeBox] OK! Successfully scanned and connected to UI named: {safeBoxUI.gameObject.name}</color>");
            }
            else
            {
                Debug.LogWarning("<color=orange>[SafeBox] Warning: SafeBoxUI not found during Start(). The HUD UI might spawn slower than the Safe. Will try searching again when pressing F!</color>");
            }
        }
    }

    public string GetPromptMessage() => _isOpened ? "Safe is open" : "Enter Safe Password (F)";

    public void Interact(GameObject actor)
    {
        Debug.Log($"<color=magenta>[SafeBox] Player {actor.name} just pressed F on the Safe!</color>");

        if (_isOpened)
        {
            Debug.Log("[SafeBox] Safe is already open, interaction disabled.");
            return;
        }

        // SAFETY NET: If Start() missed it because the UI spawned later, try searching again upon pressing F!
        if (safeBoxUI == null)
        {
            Debug.Log("[SafeBox] UI not found at Start, searching again for the 2nd time...");
            safeBoxUI = Object.FindFirstObjectByType<SafeBoxUI>(FindObjectsInactive.Include);
        }

        if (safeBoxUI != null)
        {
            Debug.Log($"<color=yellow>[SafeBox] Calling OpenUI() on GameObject: {safeBoxUI.gameObject.name}</color>");
            safeBoxUI.OpenUI(this, actor);
        }
        else
        {
            Debug.LogError("<color=red>[SafeBox] FAILED! Searched twice but still cannot find SafeBoxUI on the HUD! Please check if the UI prefab contains SafeBoxUI.cs.</color>");
        }
    }

    public void SubmitCode(List<int> inputIndices)
    {
        if (_isOpened || puzzleManager == null) return;

        bool isCorrect = puzzleManager.TryUnlock(inputIndices);

        if (isCorrect)
        {
            // CHANGED THIS LINE TO A STRING FORMAT AS FOLLOWS:
            photonView.RPC("RpcOpenSafeAndSpawnItem", RpcTarget.MasterClient);
        }
    }

    [PunRPC]
    public void RpcOpenSafeAndSpawnItem()
    {
        if (!PhotonNetwork.IsMasterClient || _isOpened) return;

        PhotonNetwork.InstantiateRoomObject(itemPrefabName, itemSpawnPoint.position, itemSpawnPoint.rotation);
        photonView.RPC(nameof(RpcSyncSafeOpened), RpcTarget.AllBuffered);
    }

    [PunRPC]
    public void RpcSyncSafeOpened()
    {
        _isOpened = true;
        Debug.Log("<color=yellow>[SafeBox] CLICK! The safe is open! The spark plug has popped out!</color>");
    }
}