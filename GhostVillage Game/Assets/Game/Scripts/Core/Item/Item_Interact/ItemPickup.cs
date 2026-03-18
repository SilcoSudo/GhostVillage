using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;

namespace Game.Core.Interaction // Gom vào namespace cho gọn
{
    public class ItemPickup : MonoBehaviourPun, IInteractable
    {
        [Header("Item Data")]
        // Đây là điểm mấu chốt: Nó nhận mọi loại ItemDataSO (Máu, Đèn, Chìa khóa...)
        public ItemDataSO data;

        [Header("Settings")]
        public string promptText = "Nhặt"; // Để ngắn gọn, VD: "Nhặt (Bình Máu) (F)"

        public void Interact(GameObject actor)
        {
            // Kiểm tra item data có tồn tại không
            if (data == null)
            {
                Debug.LogError($"[ItemPickup] Vật phẩm {gameObject.name} chưa gắn Data!");
                return;
            }

            // Logic cũ của Hùng giữ nguyên
            Debug.Log($"[Pickup] {actor.name} đang nhặt {data.itemName}");

            var playerInteract = actor.GetComponent<PlayerInteract>();
            PhotonView actorPv = actor.GetComponent<PhotonView>();

            // Chỉ xử lý nếu là Local Player (người đang điều khiển)
            if (playerInteract != null && actorPv != null && actorPv.IsMine)
            {
                TryPickup(playerInteract);
            }
        }

        private void TryPickup(PlayerInteract player)
        {
            var inventory = player.GetComponent<InventoryManager>();
            if (inventory == null) return;

            // Thử thêm vào túi (InventoryManager sẽ check full slot)
            if (inventory.AddItem(data))
            {
                // Nếu item này có Model cầm tay (VD: Đèn pin) -> Gắn luôn vào tay
                // Nếu item là Bình máu và bạn không muốn cầm ngay -> Trong Data đừng gắn HandModel
                if (data.itemHandModel != null)
                {
                    player.AttachHeldItem(data.itemHandModel);
                }

                // Xử lý hủy object đồng bộ qua mạng
                if (PhotonNetwork.IsMasterClient)
                {
                    PhotonNetwork.Destroy(gameObject);
                }
                else
                {
                    photonView.RPC(nameof(RequestDestroyRPC), RpcTarget.MasterClient);
                }
            }
            else
            {
                // Nếu túi đầy, có thể hiện thông báo UI ở đây
                Debug.Log("Túi đầy, không nhặt được!");
            }
        }

        [PunRPC]
        public void RequestDestroyRPC()
        {
            PhotonNetwork.Destroy(gameObject);
        }

        public string GetPromptMessage()
        {
            string itemName = data != null ? data.itemName : "???";
            return $"{promptText} {itemName} (F)";
        }
    }
}