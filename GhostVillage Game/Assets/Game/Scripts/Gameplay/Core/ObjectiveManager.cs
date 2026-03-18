using System;
using UnityEngine;
using Photon.Pun;
using Game.Scripts.Gameplay.Core;

public abstract class ObjectiveManager : MonoBehaviourPunCallbacks
{
    public static event Action OnAnyObjectiveCompleted;

    public abstract void Initialize();

    protected abstract void CheckProgress(ItemDataSO item);

    public override void OnEnable()
    {
        base.OnEnable();
        InventoryManager.OnGlobalItemAdded += HandleItemPickup;
    }

    public override void OnDisable()
    {
        base.OnDisable();
        InventoryManager.OnGlobalItemAdded -= HandleItemPickup;
    }

    private void HandleItemPickup(ItemDataSO item, InventoryManager inv)
    {
        CheckProgress(item);
    }

    // Helper: Bắn sự kiện cập nhật tiến độ (VD: 1/5)
    protected void NotifyProgress(int current, int total)
    {
        // GameplayEvents.OnObjectiveProgress?.Invoke(current, total); // Tạm khóa vì không có trong list
        Debug.Log($"[UI Update] Progress: {current}/{total}");
    }


}