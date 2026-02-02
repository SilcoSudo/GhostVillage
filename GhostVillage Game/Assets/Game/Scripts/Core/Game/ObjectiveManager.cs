using System.Collections.Generic;
using UnityEngine;

public abstract class ObjectiveManager : MonoBehaviour
{
    public abstract void Initialize();
    protected abstract void CheckProgress(KeyItemData item);

    private void OnEnable()
    {
        // Đăng ký nghe: Cứ ai nhặt đồ là tao check
        InventoryManager.OnGlobalItemAdded += HandleItemPickup;
    }

    private void OnDisable()
    {
        InventoryManager.OnGlobalItemAdded -= HandleItemPickup;
    }

    private void HandleItemPickup(KeyItemData item, InventoryManager inv)
    {
        // Ở đây có thể check xem inv có phải là LocalPlayer không nếu cần
        CheckProgress(item);
    }

    protected void NotifyObjectiveComplete()
    {
        // Chỉ khi nào HOÀN THÀNH thì mới báo sếp GameManager
        GameManager.Instance.OnObjectiveCompleted();
    }
}
