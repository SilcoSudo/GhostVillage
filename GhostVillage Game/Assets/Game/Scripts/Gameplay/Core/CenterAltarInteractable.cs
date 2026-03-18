using UnityEngine;
using Photon.Pun;
using Photon.Realtime;
using Game.Scripts.Gameplay.Core;
using Game.Core.Player.RayCast; // Thêm namespace chứa IInteractable

public class CenterAltarInteractable : MonoBehaviourPun, IInteractable
{
    [Header("UI Interaction")]
    [Tooltip("Dòng chữ hiện lên khi trỏ vào")]
    public string promptText = "Kích hoạt Cổng Chính";

    [Header("Logic Điều Kiện")]
    [Tooltip("Tổng số KeyItem cả team cần có")]
    public int requiredTotalKeys = 3;

    [Header("Logic Thoát Hiểm")]
    [Tooltip("Prefab Cổng sẽ spawn ra (Đặt trong Resources)")]
    public GameObject exitGatePrefab;

    [Tooltip("Vị trí spawn cổng")]
    public Transform gateSpawnPoint;

    [Tooltip("Vật phẩm thoát hiểm (Con Gà) sẽ phát cho người chơi")]
    public ItemDataSO escapeToolItem;

    private bool _isActivated = false;

    // --- IInteractable Implementation ---

    public string GetPromptMessage()
    {
        if (_isActivated) return "Đã kích hoạt";
        return $"{promptText} (F)";
    }

    public void Interact(GameObject actor)
    {
        if (_isActivated) return;

        Debug.Log($"[Altar] Người chơi {actor.name} đang tương tác. Gửi yêu cầu check...");

        // Kiểm tra photonView trước khi gọi để tránh NullReference
        if (photonView != null)
        {
            photonView.RPC(nameof(CheckAltarConditionRPC), RpcTarget.MasterClient);
        }
        else
        {
            Debug.LogError("[Altar] Thiếu PhotonView component!");
        }
    }

    // --- Network RPCs ---

    [PunRPC]
    private void CheckAltarConditionRPC()
    {
        if (!PhotonNetwork.IsMasterClient) return;

        int currentTotalKeys = 0;

        foreach (Player p in PhotonNetwork.PlayerList)
        {
            if (p.CustomProperties.ContainsKey("KeyCount"))
            {
                currentTotalKeys += (int)p.CustomProperties["KeyCount"];
            }
        }

        Debug.Log($"[Altar] Tổng Key cả team: {currentTotalKeys}/{requiredTotalKeys}");

        if (currentTotalKeys >= requiredTotalKeys)
        {
            if (exitGatePrefab != null && gateSpawnPoint != null)
            {
                PhotonNetwork.Instantiate(exitGatePrefab.name, gateSpawnPoint.position, gateSpawnPoint.rotation);
                Debug.Log("[Altar] Master đã spawn Exit Gate.");
            }

            photonView.RPC(nameof(ActivateAltarSuccessRPC), RpcTarget.AllBuffered);
        }
        else
        {
            Debug.LogWarning("[Altar] Chưa đủ chìa khóa!");
        }
    }

    [PunRPC]
    private void ActivateAltarSuccessRPC()
    {
        if (_isActivated) return;
        _isActivated = true;

        Debug.Log("<color=green>[Altar] KÍCH HOẠT! BẮT ĐẦU ESCAPE PHASE!</color>");

        ProcessLocalPlayerInventory();

        // Kiểm tra null trước khi invoke event
        GameplayEvents.OnAltarActivated?.Invoke();
    }

    // --- Private Helpers ---

    private void ProcessLocalPlayerInventory()
    {
        // Dùng biến Static Instance đã tối ưu
        var inv = InventoryManager.LocalInstance;

        if (inv != null)
        {
            // Gọi hàm gộp trong InventoryManager (Đã sửa ở bước trước)
            inv.ClearInventoryAndLock();

            if (escapeToolItem != null)
            {
                inv.AddItem(escapeToolItem);
                inv.SelectSlot(0);
                Debug.Log("[Altar] Đã phát Escape Tool cho người chơi.");
            }
        }
        else
        {
            // Fallback nếu Static chưa gán kịp (ít xảy ra nhưng an toàn)
            var allInventories = FindObjectsOfType<InventoryManager>();
            foreach (var i in allInventories)
            {
                if (i.photonView.IsMine)
                {
                    i.ClearInventoryAndLock();
                    if (escapeToolItem != null)
                    {
                        i.AddItem(escapeToolItem);
                        i.SelectSlot(0);
                    }
                    return;
                }
            }
            Debug.LogError("[Altar] Không tìm thấy Local Inventory Instance!");
        }
    }
}