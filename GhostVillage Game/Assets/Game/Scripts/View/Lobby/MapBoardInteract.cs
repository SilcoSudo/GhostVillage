using Game.Scripts.UI.Lobby;
using UnityEngine;

namespace Game.Scripts.View.Lobby
{
    public class MapBoardInteract : Interactable
    {
        [Header("References")]
        // Kéo GameObject chứa script LobbyManager vào đây
        [SerializeField] private LobbyManager _lobbyManager;

        // XÓA [System.Obsolete] ĐI LÀ HẾT LỖI
        public override void Interact(GameObject actor)
        {
            Debug.Log("[Interact] Yêu cầu mở bảng chọn Map...");

            if (_lobbyManager == null)
            {
                // Thay FindObjectOfType (cũ) bằng FindFirstObjectByType (mới)
                _lobbyManager = Object.FindFirstObjectByType<LobbyManager>();
            }

            if (_lobbyManager != null)
            {
                _lobbyManager.OpenMapPicker();
            }
        }
    }
}