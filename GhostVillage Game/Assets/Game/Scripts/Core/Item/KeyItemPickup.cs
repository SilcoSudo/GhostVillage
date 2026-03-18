using UnityEngine;
using Photon.Pun;
// SỬA: Namespace đúng chứa PlayerInteract (dựa trên file PlayerInteract bạn gửi trước đó)
using Game.Core.Player.RayCast;

public class KeyItemPickup : MonoBehaviourPun, IInteractable // Thêm MonoBehaviourPun để dùng photonView
{
    [Header("Key Item Settings")]
    public ItemDataSO data; // Lưu ý: Dùng ItemDataSO thay vì KeyItemData nếu bạn đã đổi tên

    [Header("Prompt Settings")]
    public string promptText = "Nhặt vật phẩm";

    // SỬA: Thêm tham số actor
    public void Interact(GameObject actor)
    {
        // Logic mới: Không cần tìm tất cả player. Actor chính là người bấm nút F.
        Debug.Log($"[Pickup] {actor.name} đang cố nhặt {data.itemName}");

        var playerInteract = actor.GetComponent<PlayerInteract>();

        // Kiểm tra xem người tương tác có phải là Local Player không (quan trọng cho Photon)
        PhotonView actorPv = actor.GetComponent<PhotonView>();

        if (playerInteract != null && actorPv != null && actorPv.IsMine)
        {
            TryPickup(playerInteract);
        }
    }

    private void TryPickup(PlayerInteract player)
    {
        var inventory = player.GetComponent<InventoryManager>();
        if (inventory == null) return;

        // Thêm vào túi đồ
        if (inventory.AddItem(data))
        {
            // Nếu có Prefab cầm tay -> Gắn vào tay
            if (data.itemHandModel != null)
            {
                player.AttachHeldItem(data.itemHandModel);
            }

            // Hủy vật phẩm dưới đất (Đồng bộ qua mạng)
            if (PhotonNetwork.IsMasterClient)
            {
                PhotonNetwork.Destroy(gameObject);
            }
            else
            {
                // Gửi RPC yêu cầu Master hủy (nếu không phải chủ phòng)
                photonView.RPC("RequestDestroyRPC", RpcTarget.MasterClient);
            }
        }
    }

    [PunRPC]
    public void RequestDestroyRPC()
    {
        PhotonNetwork.Destroy(gameObject);
    }

    public string GetPromptMessage()
    {
        string itemName = data != null ? data.itemName : "vật phẩm";
        return $"{promptText} ({itemName}) (F)";
    }
}