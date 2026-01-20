using System.Collections.Generic;
using UnityEngine;

public abstract class ObjectiveManager : MonoBehaviour
{
    [Header("Common Objective Settings")]
    public List<KeyItemData> requiredItems = new();
    public GameObject portalPrefab;
    public Transform[] portalSpawnPoints;

    protected bool portalSpawned = false;
    public abstract void Initialize();
    public abstract void OnItemCollected(KeyItemData item, InventoryManager playerInventory);
    public abstract void OnTriggerActivated(string triggerId);
    public abstract bool IsObjectiveComplete();

    protected void SpawnPortal()
    {
        if (portalSpawned)
        {
            Debug.Log("[Objective] Portal đã spawn rồi, bỏ qua!");
            return;
        }

        if (portalPrefab == null || portalSpawnPoints.Length == 0)
        {
            Debug.LogWarning("[Objective] Thiếu portalPrefab hoặc spawnPoints!");
            return;
        }

        var spawn = portalSpawnPoints[Random.Range(0, portalSpawnPoints.Length)];
        Instantiate(portalPrefab, spawn.position, spawn.rotation);
        portalSpawned = true;
        Debug.Log($"[Objective] Portal spawned tại {spawn.position}");

        GameManager.Instance.SetState(GameState.Triggered);
    }
}
