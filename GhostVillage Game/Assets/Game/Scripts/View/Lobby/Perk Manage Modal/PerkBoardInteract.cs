using UnityEngine;
using Game.Scripts.UI.Lobby;

namespace Game.Scripts.View.Lobby
{
    public class PerkBoardInteract : Interactable
    {
        [Header("UI Reference")]
        [SerializeField] private LobbyUIManager _lobbyUI;

        public override void Interact(GameObject actor)
        {
            Debug.Log("[Interact] Mở bảng quản lý Perk (Kỹ Năng).");

            // Nếu lười chưa kéo thả trong Inspector thì tự đi tìm
            if (_lobbyUI == null)
            {
                _lobbyUI = Object.FindFirstObjectByType<LobbyUIManager>();
            }

            if (_lobbyUI != null)
            {
                // Gọi đúng cái hàm bật Bảng Perk mà ta vừa đẻ ra hồi nãy
                _lobbyUI.ShowManagePerkModal(true);
            }
            else
            {
                Debug.LogError(" [PerkBoardInteract] Chết dở, không tìm thấy LobbyUIManager trong Scene!");
            }
        }
    }
}