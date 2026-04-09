using UnityEngine;
using TMPro;
using UnityEngine.UI;
using Photon.Realtime;
using Photon.Pun;
using Photon.Voice.Unity;
using System;
using Game.Script.UI;

namespace Game.Scripts.UI.Lobby
{
    /// <summary>
    /// Quản lý hiển thị và logic của một ô người chơi trong bảng Friend Board.
    /// Bao gồm hai trạng thái: Đang hoạt động (Active) và Trống (Empty).
    /// </summary>
    public class FriendBoardItem : MonoBehaviourPun
    {
        [Header("State Groups")]
        [SerializeField] private GameObject _grpActive;
        [SerializeField] private GameObject _grpEmpty;

        [Header("Active UI Elements")]
        [SerializeField] private TextMeshProUGUI _txtPlayerName;
        [SerializeField] private Slider _sldVolume;
        [SerializeField] private Button _btnMute;
        [SerializeField] private Button _btnKick;
        [SerializeField] private Button _btnAddFriend;

        [Header("Empty UI Elements")]
        [SerializeField] private Button _btnInvite;

        private Player _targetPlayer;

        private bool _isMuted = false;
        private float _lastVolume = 1f;

        /// <summary>
        /// Nạp dữ liệu người chơi vào slot và cấu hình quyền hạn (Kick, Add Friend).
        /// </summary>
        [System.Obsolete]
        public void Setup(Player player, Game.Domain.Friend.Controllers.FriendController friendController, GlobalUIManager globalUI)
        {
            _targetPlayer = player;
            _grpActive.SetActive(true);
            _grpEmpty.SetActive(false);

            _txtPlayerName.text = player.NickName;

            // Chỉ Master Client mới thấy nút Kick và không thể tự đuổi chính mình
            bool canKick = PhotonNetwork.IsMasterClient && !player.IsLocal;
            _btnKick.gameObject.SetActive(canKick);
            _btnKick.onClick.RemoveAllListeners();
            _btnKick.onClick.AddListener(() =>
            {
                Debug.Log($"<color=red>[Photon] MasterClient đang thực thi quyền sinh sát: Tống cổ {player.NickName}</color>");

                // [FIX CHÍ MẠNG]: Mượn PhotonView của LobbyManager để gửi lệnh (Vì UI không có PhotonView)
                var lobbyManager = FindObjectOfType<LobbyManager>();
                if (lobbyManager != null && lobbyManager.photonView != null)
                {
                    // Gửi đích danh tới máy của thằng bị kick
                    lobbyManager.photonView.RPC("RPC_GetKicked", player);
                }
                else
                {
                    Debug.LogError("[FriendBoard] Không tìm thấy LobbyManager để gửi lệnh Kick!");
                }
            });

            _sldVolume.gameObject.SetActive(!player.IsLocal); // Không tự chỉnh âm lượng bản thân
            _sldVolume.onValueChanged.RemoveAllListeners();
            _sldVolume.value = 1f; // Mặc định âm lượng tối đa
            _sldVolume.onValueChanged.AddListener((val) => SetLocalVolume(val));

            // LOGIC MUTE LOCAL (BUTTON MUTE)
            _btnMute.gameObject.SetActive(!player.IsLocal);
            _btnMute.onClick.RemoveAllListeners();
            _btnMute.onClick.AddListener(() =>
            {
                _isMuted = !_isMuted;
                _btnMute.image.color = _isMuted ? Color.red : Color.white;
                SetLocalVolume(_isMuted ? 0f : _sldVolume.value);
            });

            // ==========================================
            // [FIX CHÍ MẠNG 2]: LOGIC KẾT BẠN (ADD FRIEND)
            // ==========================================
            if (_btnAddFriend != null)
            {
                if (player.IsLocal)
                {
                    _btnAddFriend.gameObject.SetActive(false); // Ẩn nút nếu là chính mình
                }
                else
                {
                    // 1. Quét xem đã là bạn bè chưa
                    bool isAlreadyFriend = false;
                    if (friendController != null && friendController.FriendList.Value != null)
                    {
                        foreach (var friend in friendController.FriendList.Value)
                        {
                            // Dò theo ID Photon hoặc dò theo Tên hiển thị để chống "trượt"
                            if (friend.GetUserId() == player.UserId || friend.GetDisplayName() == player.NickName)
                            {
                                isAlreadyFriend = true;
                                break;
                            }
                        }
                    }

                    if (isAlreadyFriend)
                    {
                        // 2. Đã là bạn thì ẩn cmn nút luôn
                        _btnAddFriend.gameObject.SetActive(false);
                    }
                    else
                    {
                        // 3. Chưa là bạn thì hiện nút và gắn API
                        _btnAddFriend.gameObject.SetActive(true);
                        _btnAddFriend.interactable = true;
                        _btnAddFriend.onClick.RemoveAllListeners();
                        _btnAddFriend.onClick.AddListener(async () =>
                        {
                            try
                            {
                                // ✅ FIX: Lấy UID 8 số từ CustomProperties (được gửi khi join room)
                                // CustomProperties phải có "UID" key do PhotonNetworkManager gửi
                                string targetUid = player.CustomProperties.ContainsKey("UID")
                                    ? (string)player.CustomProperties["UID"]
                                    : null;

                                Debug.Log($"<color=cyan>[FriendBoard] Ấn kết bạn - Người chơi: {player.NickName} | UID: {targetUid}</color>");

                                if (string.IsNullOrEmpty(targetUid))
                                {
                                    Debug.LogError($"<color=red>[FriendBoard] ❌ Không lấy được UID từ CustomProperties!</color>");
                                    if (globalUI != null) globalUI.ShowError("Lỗi", "Không thể lấy ID của người chơi này!");
                                    return;
                                }

                                Debug.Log($"<color=yellow>[FriendBoard] Gửi lời mời kết bạn tới UID: {targetUid}</color>");
                                bool isSuccess = await friendController.SendFriendRequest(targetUid);

                                Debug.Log($"<color=cyan>[FriendBoard] SendFriendRequest result: {isSuccess}</color>");

                                if (isSuccess)
                                {
                                    Debug.Log($"<color=green>[FriendBoard] ✅ Gửi thành công!</color>");
                                    _btnAddFriend.interactable = false; // Bóp nút chặn click nháy
                                    if (globalUI != null) globalUI.ShowError("Thành công", $"Đã gửi lời mời kết bạn tới {player.NickName}!");
                                }
                                else
                                {
                                    Debug.LogWarning($"<color=red>[FriendBoard] ❌ SendFriendRequest trả về false!</color>");
                                    if (globalUI != null) globalUI.ShowError("Lỗi", "Gửi lời mời thất bại hoặc đã gửi trước đó!");
                                }
                            }
                            catch (Exception e)
                            {
                                Debug.LogError($"<color=red>[FriendBoard] Exception: {e.Message}\n{e.StackTrace}</color>");
                                if (globalUI != null) globalUI.ShowError("Lỗi hệ thống", "Không thể gửi lời mời lúc này.");
                            }
                        });
                    }
                }
            }
        }

        /// <summary>
        /// Chuyển slot về trạng thái trống khi không có người chơi.
        /// </summary>
        public void SetEmpty(System.Action onInviteClicked = null) // Sửa tham số truyền vào
        {
            _targetPlayer = null;
            _grpActive.SetActive(false);
            _grpEmpty.SetActive(true);

            // MÓC NÚT INVITE
            if (_btnInvite != null)
            {
                _btnInvite.onClick.RemoveAllListeners();
                if (onInviteClicked != null)
                {
                    _btnInvite.onClick.AddListener(() => onInviteClicked.Invoke());
                }
            }
        }

        /// <summary>
        /// Tìm Speaker của người chơi mục tiêu trong Scene và chỉnh âm lượng chỉ trên máy này.
        /// </summary>
        [System.Obsolete]
        private void SetLocalVolume(float volume)
        {
            if (_targetPlayer == null) return;

            // Tìm Speaker dựa trên OwnerActorNr - Cách này là chuẩn nhất cho Photon Voice
            Speaker[] allSpeakers = FindObjectsOfType<Speaker>();
            foreach (var s in allSpeakers)
            {
                // Speaker thường nằm trên GameObject có PhotonView của người chơi đó
                var pv = s.GetComponentInParent<PhotonView>();
                if (pv != null && pv.OwnerActorNr == _targetPlayer.ActorNumber)
                {
                    var audioSource = s.GetComponent<AudioSource>();
                    if (audioSource != null)
                    {
                        audioSource.volume = volume;
                        Debug.Log($"[Audio] Đã chỉnh Volume cho {_targetPlayer.NickName} thành: {volume}");
                    }
                    break;
                }
            }
        }

        [PunRPC]
        public void RPC_GetKicked(int targetActorNumber)
        {
            // ✅ Chỉ kick nếu ActorNumber match với LocalPlayer
            if (PhotonNetwork.LocalPlayer.ActorNumber != targetActorNumber)
                return;

            Debug.Log("<color=red>Bạn đã bị chủ phòng Kick!</color>");

            // Ngắt kết nối Voice trước để tránh lỗi "LeaveRoom not allowed on MasterServer"
            var voiceClient = Photon.Voice.PUN.PunVoiceClient.Instance;
            if (voiceClient != null && voiceClient.Client.InRoom)
            {
                voiceClient.Client.OpLeaveRoom(false);
            }

            PhotonNetwork.LeaveRoom();
        }
    }
}