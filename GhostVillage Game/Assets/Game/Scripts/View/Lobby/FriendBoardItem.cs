using UnityEngine;
using TMPro;
using UnityEngine.UI;
using Photon.Realtime;
using Photon.Pun;
using Photon.Voice.Unity;

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
        /// Nạp dữ liệu người chơi vào slot và cấu hình quyền hạn (Kick).
        /// </summary>
        [System.Obsolete]
        public void Setup(Player player)
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
                Debug.Log($"[Photon] Đang Kick người chơi qua RPC: {player.NickName}");
                // Gửi lệnh Kick tới đúng người chơi đó
                PhotonView.Get(this).RPC("RPC_GetKicked", player);
            });

            _sldVolume.gameObject.SetActive(!player.IsLocal); // Không tự chỉnh âm lượng bản thân
            _sldVolume.onValueChanged.RemoveAllListeners();
            _sldVolume.value = 1f; // Mặc định âm lượng tối đa
            _sldVolume.onValueChanged.AddListener((val) => SetLocalVolume(val));

            // 3. LOGIC MUTE LOCAL (BUTTON MUTE)
            _btnMute.gameObject.SetActive(!player.IsLocal);
            _btnMute.onClick.RemoveAllListeners();
            _btnMute.onClick.AddListener(() =>
            {
                _isMuted = !_isMuted;
                _btnMute.image.color = _isMuted ? Color.red : Color.white;
                SetLocalVolume(_isMuted ? 0f : _sldVolume.value);
            });

            if (_btnAddFriend != null)
            {
                _btnAddFriend.gameObject.SetActive(!player.IsLocal);
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
        public void RPC_GetKicked()
        {
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