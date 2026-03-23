using UnityEngine;
using UnityEngine.UI;
using System.Linq;
using R3;
using Game.Domain.Friend.Controllers;
using Game.Core.Network.Chat;
using Photon.Pun;
using System;

namespace Game.Scripts.UI.Lobby
{
    public class InviteFriendModalUI : MonoBehaviour
    {
        [SerializeField] private Transform _content;
        [SerializeField] private GameObject _itemPrefab;
        [SerializeField] private Button _btnClose;

        private FriendController _friendController;
        private GlobalChatManager _chatManager;
        private IDisposable _statusSub;

        private void Awake()
        {
            _btnClose.onClick.AddListener(CloseModal);
        }

        // LobbyUIManager sẽ gọi hàm này và bơm thuốc vào
        public void OpenModal(FriendController friendController, GlobalChatManager chatManager)
        {
            _friendController = friendController;
            _chatManager = chatManager;
            gameObject.SetActive(true);

            // Bắt đầu lắng nghe Rada (Cứ hễ có đứa online/offline là vẽ lại list)
            _statusSub?.Dispose();
            _statusSub = _friendController.FriendStatuses.Subscribe(_ => RefreshList());

            RefreshList();
        }

        private void RefreshList()
        {
            // Dọn sạch rác cũ
            foreach (Transform child in _content) Destroy(child.gameObject);

            var friends = _friendController.FriendList.Value;
            var statuses = _friendController.FriendStatuses.Value;

            foreach (var f in friends)
            {
                var obj = Instantiate(_itemPrefab, _content);
                var itemUI = obj.GetComponent<FriendInviteItemUI>();

                // Lấy trạng thái từ Rada (mặc định 0 là Offline)
                int status = statuses.ContainsKey(f.GetUserId()) ? statuses[f.GetUserId()] : 0;

                // Quét xem đứa này có đang đứng chình ình trong phòng không
                bool inRoom = false;
                if (PhotonNetwork.InRoom)
                {
                    inRoom = PhotonNetwork.CurrentRoom.Players.Values.Any(p => p.NickName == f.GetDisplayName());
                }

                itemUI.Setup(f, status, inRoom, OnSendInvite);
            }
        }

        private void OnSendInvite(string targetUserId)
        {
            if (!PhotonNetwork.InRoom) return;
            // BẮN THIỆP MỜI QUA GLOBAL CHAT MANAGER
            _chatManager.SendRoomInvite(targetUserId, PhotonNetwork.CurrentRoom.Name);
        }

        public void CloseModal()
        {
            _statusSub?.Dispose(); // Ngừng nghe Rada để tiết kiệm RAM
            gameObject.SetActive(false);
        }
    }
}