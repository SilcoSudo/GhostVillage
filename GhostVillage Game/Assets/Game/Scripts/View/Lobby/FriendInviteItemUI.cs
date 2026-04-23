using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;
using Game.Domain.Friend.DTOs;

namespace Game.Scripts.UI.Lobby
{
    public class FriendInviteItemUI : MonoBehaviour
    {
        [SerializeField] private TMP_Text _txtDisplayName;
        [SerializeField] private TMP_Text _txtStatus;
        [SerializeField] private Button _btnInvite;
        [SerializeField] private TMP_Text _txtInviteBtn;

        private string _targetUserId;

        public void Setup(FriendProfileDTO friend, int status, bool isInSameRoom, Action<string> onInviteClicked)
        {
            _targetUserId = friend.GetUserId();
            _txtDisplayName.text = friend.GetDisplayName();

            _btnInvite.onClick.RemoveAllListeners();
            _btnInvite.onClick.AddListener(() =>
            {
                onInviteClicked?.Invoke(_targetUserId);
                _btnInvite.interactable = false;
                _txtInviteBtn.text = "Sent";
            });

            // LOGIC KHÓA MÕM VÀ ĐỔI MÀU TRỰC TIẾP KHÔNG DÙNG THẺ HTML
            if (isInSameRoom)
            {
                _txtStatus.text = "In Room";
                _txtStatus.color = Color.yellow; // Đổi màu xịn
                _btnInvite.interactable = false;
                _txtInviteBtn.text = "In Room";
            }
            else if (status == 2) // 2 = Online trong Photon Chat
            {
                _txtStatus.text = "Online";
                _txtStatus.color = Color.green;
                _btnInvite.interactable = true;
                _txtInviteBtn.text = "Invite";
            }
            else
            {
                _txtStatus.text = "Offline";
                _txtStatus.color = Color.gray;
                _btnInvite.interactable = false;
                _txtInviteBtn.text = "Offline";
            }
        }
    }
}