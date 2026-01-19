using UnityEngine;

public class KeyItemPickup : MonoBehaviour, IInteractable
{
    [Header("Key Item Settings")]
    public KeyItemData data;

    [Header("Prompt Settings")]
    public string promptText = "Nhặt vật phẩm";
    public KeyCode interactKey = KeyCode.F;

    public void Interact(PlayerInteract player)
    {
        TryPickup(player);
    }

    private void TryPickup(PlayerInteract player)
    {
        var inventory = player.GetComponent<InventoryManager>();
        if (inventory == null)
        {
            Debug.LogWarning("Player không có InventoryManager component!");
            return;
        }

        if (inventory.AddItem(data))
        {
            // Nếu có prefab để cầm trên tay, spawn vào tay player
            if (data.heldPrefab != null)
            {
                player.AttachHeldItem(data.heldPrefab);
            }

            // Xóa vật phẩm khỏi thế giới
            Destroy(gameObject);
        }
    }

    // === IInteractable interface ===
    public string GetPromptMessage()
    {
        // Hiển thị như: "Nhấn F để nhặt Chìa khóa"
        string itemName = data != null ? data.itemName : "vật phẩm";
        return $"{promptText}";
    }

    public KeyCode InteractKey => interactKey;
}
