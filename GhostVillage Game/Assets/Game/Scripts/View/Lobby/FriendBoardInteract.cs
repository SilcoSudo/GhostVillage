using UnityEngine;
using Game.Scripts.UI.Lobby;
using VContainer;
using Game.Domain.Friend.Controllers; // Nhớ Using cái này
using Cysharp.Threading.Tasks;

namespace Game.Scripts.View.Lobby
{
    public class FriendBoardInteract : Interactable
    {
        [Header("UI Reference")]
        [SerializeField] private LobbyUIManager _lobbyUI;

        public override void Interact(GameObject actor)
        {
            Debug.Log("[Interact] Mở bảng quản lý người chơi. Đang đồng bộ dữ liệu...");

            // ==========================================
            // [FIX CHÍ MẠNG 3]: Bắt nó gọi API tải lại danh sách mới nhất mỗi khi bấm F
            // ==========================================
            var scope = Object.FindFirstObjectByType<VContainer.Unity.LifetimeScope>();
            if (scope != null)
            {
                var friendController = scope.Container.Resolve<FriendController>();
                if (friendController != null)
                {
                    friendController.RefreshDataAsync().Forget(); // Ép refresh ngầm
                }
            }

            if (_lobbyUI == null)
            {
                _lobbyUI = Object.FindFirstObjectByType<LobbyUIManager>();
            }

            if (_lobbyUI != null)
            {
                _lobbyUI.ShowManagementModal(true);
            }
        }
    }
}