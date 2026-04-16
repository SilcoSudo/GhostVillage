using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;
using Game.Scripts.Gameplay.Puzzles.Map2;

public class OngHaiTableSlot : MonoBehaviourPun, IInteractable
{
    [Header("Manager Reference")]
    public OngHaiPuzzleManager puzzleManager;
    public int slotIndex;

    private ItemDataSO _currentlyPlacedItem;
    private bool _isOccupied = false;
    private GameObject _spawnedDummyVisual;

    public string GetPromptMessage()
    {
        if (_isOccupied && _currentlyPlacedItem != null)
        {
            return $"Rút {_currentlyPlacedItem.itemName} (F)";
        }
        return "Cắm đồ đang cầm (F)";
    }

    public void Interact(GameObject actor)
    {
        var inventory = actor.GetComponent<InventoryManager>();
        if (inventory == null) return;

        PhotonView actorPv = actor.GetComponent<PhotonView>();
        if (actorPv != null && actorPv.IsMine)
        {
            if (_isOccupied)
            {
                TryRemoveItem(inventory);
            }
            else
            {
                TryPlaceItem(inventory);
            }
        }
    }

    private void TryPlaceItem(InventoryManager inventory)
    {
        int currentSlot = inventory.currentSlotIndex;
        if (currentSlot >= inventory.items.Length) return;

        ItemDataSO itemToPlace = inventory.items[currentSlot];

        // Đề phòng trường hợp tay không bấm F
        if (itemToPlace == null) return;

        if (itemToPlace.itemType != ItemType.Equipment)
        {
            Debug.LogWarning("<color=yellow>[Slot] Chỉ được cắm đồ nghề (Equipment) vào đây!</color>");
            return;
        }

        // Bỏ qua việc gán _currentlyPlacedItem ở đây, để dành cho hàm RPC lo
        if (inventory.RemoveItem(itemToPlace))
        {
            photonView.RPC(nameof(PlaceItemRPC), RpcTarget.AllBuffered, itemToPlace.itemId);
        }
    }

    private void TryRemoveItem(InventoryManager inventory)
    {
        if (_currentlyPlacedItem != null)
        {
            if (inventory.AddItem(_currentlyPlacedItem))
            {
                photonView.RPC(nameof(RemoveItemRPC), RpcTarget.AllBuffered);
            }
            else
            {
                Debug.LogWarning("<color=yellow>[Slot] Túi đầy rồi, không rút ra được!</color>");
            }
        }
    }

    [PunRPC]
    private void PlaceItemRPC(string itemID)
    {
        _isOccupied = true;

        if (puzzleManager != null)
        {
            // 1. CHỐT CHẶN AN TOÀN: Gán Data ở trong hàm RPC để tất cả các máy đều nhận diện được món đồ
            _currentlyPlacedItem = puzzleManager.GetItemDataByID(itemID);

            // 2. Dùng HAND MODEL (Mô hình cầm tay) để đẻ ra làm cảnh cho siêu nhẹ
            if (_currentlyPlacedItem != null && _currentlyPlacedItem.itemHandModel != null)
            {
                _spawnedDummyVisual = Instantiate(_currentlyPlacedItem.itemHandModel, transform.position, transform.rotation);
                _spawnedDummyVisual.transform.localScale = _currentlyPlacedItem.itemHandModel.transform.localScale;

                if (transform.parent != null)
                {
                    _spawnedDummyVisual.transform.SetParent(transform.parent, true);
                }

                // Tắt Collider phòng trường hợp HandModel lỡ có gắn
                var colliders = _spawnedDummyVisual.GetComponentsInChildren<Collider>();
                foreach (var col in colliders) col.enabled = false;
            }
            else
            {
                Debug.LogWarning($"<color=yellow>[Slot {slotIndex}] Lỗi: Món {itemID} chưa được gắn 'Item Hand Model' trong SO!</color>");
            }

            puzzleManager.UpdateSlotStatus(slotIndex, itemID);
        }

        Debug.Log($"<color=cyan>[Slot {slotIndex}] Đã cắm đồ: {itemID}</color>");
    }

    [PunRPC]
    private void RemoveItemRPC()
    {
        _isOccupied = false;

        // Xóa sổ cái xác không hồn trên bàn và dọn dẹp reference
        if (_spawnedDummyVisual != null)
        {
            Destroy(_spawnedDummyVisual);
            _spawnedDummyVisual = null;
        }

        if (puzzleManager != null)
        {
            puzzleManager.UpdateSlotStatus(slotIndex, "");
        }

        _currentlyPlacedItem = null; // Trả lại sự trong trắng cho khe cắm
        Debug.Log($"<color=cyan>[Slot {slotIndex}] Đã rút đồ ra!</color>");
    }
}