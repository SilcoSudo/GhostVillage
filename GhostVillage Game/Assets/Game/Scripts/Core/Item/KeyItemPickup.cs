using Game.Core.Player.RayCast;
using Photon.Pun;
using UnityEngine;

public class KeyItemPickup : MonoBehaviour, IInteractable
{
    [Header("Key Item Settings")]
    public KeyItemData data;

    [Header("Prompt Settings")]
    public string promptText = "Nhặt vật phẩm";


    public void Interact()
    {
        var players = Object.FindObjectsByType<PlayerInteract>(FindObjectsSortMode.None);

        foreach (var p in players)
        {
            var pv = p.GetComponent<PhotonView>();
            if (pv != null && pv.IsMine)
            {
                TryPickup(p);
                break;
            }
        }
    }

    private void TryPickup(PlayerInteract player)
    {
        // Giả sử Hùng có Component InventoryManager trên cùng GameObject với PlayerInteract
        var inventory = player.GetComponent<InventoryManager>();
        if (inventory == null) return;

        if (inventory.AddItem(data))
        {
            if (data.heldPrefab != null)
            {
                // SỬA: Fix lỗi chính tả từ 'AttachaHeldItem' thành 'AttachHeldItem'
                player.AttachHeldItem(data.heldPrefab);
            }

            // Xóa vật phẩm trên môi trường sau khi nhặt thành công
            Destroy(gameObject);
        }
    }

    public string GetPromptMessage()
    {
        string itemName = data != null ? data.itemName : "vật phẩm";
        return $"{promptText} ({itemName})"; // Tự động thêm tên vật phẩm vào prompt
    }
}
