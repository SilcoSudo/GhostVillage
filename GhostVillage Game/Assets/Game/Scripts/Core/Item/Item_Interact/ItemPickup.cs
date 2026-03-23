using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast; // Chứa interface IInteractable của bro

namespace Game.Core.Interaction
{
    [RequireComponent(typeof(PhotonView))]
    public class ItemPickup : MonoBehaviourPun, IInteractable
    {
        [Header("Item Data")]
        [Tooltip("Kéo file Scriptable Object của Medkit (hoặc item bất kỳ) vào đây")]
        public ItemDataSO data;

        [Header("Settings")]
        public string promptText = "Nhặt";

        public string GetPromptMessage()
        {
            string itemName = data != null ? data.itemName : "???";
            return $"{promptText} {itemName} (F)";
        }

        public void Interact(GameObject actor)
        {
            if (data == null)
            {
                Debug.LogError($"[ItemPickup] Vật phẩm {gameObject.name} chưa được gắn Data!");
                return;
            }

            PhotonView actorPv = actor.GetComponent<PhotonView>();

            // CHỈ THẰNG BẤM PHÍM (Local Player) MỚI ĐƯỢC CHẠY LOGIC NHẶT ĐỒ NÀY
            if (actorPv != null && actorPv.IsMine)
            {
                var inventory = actor.GetComponent<InventoryManager>();
                if (inventory != null)
                {
                    TryPickup(inventory);
                }
            }
        }

        private void TryPickup(InventoryManager inventory)
        {
            // Hỏi InventoryManager xem nhét vào túi được không? (Nó sẽ check full slot)
            if (inventory.AddItem(data))
            {
                Debug.Log($"<color=green>[ItemPickup]</color> Đã nhặt thành công: {data.itemName}");

                // XÓA OBJECT NGOÀI MAP QUA MẠNG
                if (PhotonNetwork.IsMasterClient)
                {
                    // Nếu mình là Master thì tự hủy luôn
                    PhotonNetwork.Destroy(gameObject);
                }
                else
                {
                    // Nếu là Client quèn thì xin phép Master hủy giùm
                    photonView.RPC(nameof(RequestDestroyRPC), RpcTarget.MasterClient);
                }
            }
            else
            {
                Debug.Log("<color=yellow>[ItemPickup]</color> Túi đã đầy! Không thể nhặt thêm.");
                // Gợi ý mốt làm UI: Bắn event ra đây để màn hình hiện chữ "Túi đầy"
            }
        }

        [PunRPC]
        private void RequestDestroyRPC()
        {
            // Chỉ MasterClient mới được quyền thực thi dòng này
            if (PhotonNetwork.IsMasterClient)
            {
                PhotonNetwork.Destroy(gameObject);
            }
        }
    }
}