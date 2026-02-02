using Game.Scripts.UI.Lobby;
using UnityEngine;

namespace Game.Scripts.View.Lobby
{
    public class MapBoardInteract : Interactable
    {
        [Header("References")]
        // Kéo GameObject chứa script LobbyManager vào đây
        [SerializeField] private LobbyManager _lobbyManager;

        public override void Interact()
        {
            Debug.Log("[Interact] Yêu cầu mở bảng chọn Map...");

            if (_lobbyManager == null)
            {
                Debug.LogError("<color=red>[Critical]</color> Hùng ơi, kéo LobbyManager vào script MapBoardInteract chưa??");
                return;
            }

            // Gọi vào Manager: Manager sẽ tự check data -> update UI -> hiện Modal
            _lobbyManager.OpenMapPicker();
        }
    }
}