using UnityEngine;

namespace Game.Scripts.UI.Lobby
{
    public class FriendBoardInteract : Interactable
    {
        // CHỈNH Ở ĐÂY: Dùng SerializeField thay vì Inject
        [Header("UI Reference")]
        [SerializeField] private LobbyUIManager _lobbyUI;

        [System.Obsolete]
        public override void Interact()
        {
            Debug.Log("[Interact] Mở bảng quản lý người chơi.");

            if (_lobbyUI == null)
            {
                // Nếu bị NULL, Hùng chỉ việc nhìn vào Inspector cái bảng và kéo cái LobbyUI vào là xong
                Debug.LogError("<color=red>[Critical]</color> Hùng ơi, bạn chưa kéo LobbyUI vào ô này ở Inspector cái Bảng!");
                return;
            }

            _lobbyUI.ShowManagementModal(true);
        }
    }
}