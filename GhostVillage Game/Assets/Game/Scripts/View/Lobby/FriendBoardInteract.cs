using UnityEngine;
using Game.Scripts.UI.Lobby;

namespace Game.Scripts.View.Lobby
{
    public class FriendBoardInteract : Interactable
    {
        [Header("UI Reference")]
        [SerializeField] private LobbyUIManager _lobbyUI;

        // XÓA DÒNG [System.Obsolete] ĐI LÀ HẾT LỖI
        public override void Interact(GameObject actor)
        {
            Debug.Log("[Interact] Mở bảng quản lý người chơi.");

            if (_lobbyUI == null)
            {
                // Thay FindObjectOfType (cũ) bằng FindFirstObjectByType (mới)
                _lobbyUI = Object.FindFirstObjectByType<LobbyUIManager>();
            }

            if (_lobbyUI != null)
            {
                _lobbyUI.ShowManagementModal(true);
            }
        }
    }
}