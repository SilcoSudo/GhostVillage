using System;
using System.Collections.Generic;
using UnityEngine;

public abstract class ObjectiveManager : MonoBehaviour
{
    public static event Action OnAnyObjectiveCompleted;
    public abstract void Initialize();
    protected abstract void CheckProgress(ItemDataSO item);

    private void OnEnable()
    {
        InventoryManager.OnGlobalItemAdded += HandleItemPickup;
    }

    private void OnDisable()
    {
        InventoryManager.OnGlobalItemAdded -= HandleItemPickup;
    }

    // SỬA: Thay đổi chữ ký hàm cho khớp với Event bên InventoryManager
    private void HandleItemPickup(ItemDataSO item, InventoryManager inv)
    {
        // Có thể thêm check inv.GetComponent<PhotonView>().IsMine nếu cần
        CheckProgress(item);
    }

    protected void NotifyObjectiveComplete()
    {
        Debug.Log("Objective Complete!");
        // Bắn pháo hiệu
        OnAnyObjectiveCompleted?.Invoke();
    }
}