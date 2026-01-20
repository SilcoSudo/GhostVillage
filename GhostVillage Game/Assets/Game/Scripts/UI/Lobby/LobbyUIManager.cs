using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;

namespace Game.Core.Lobby
{
    /// <summary>
    /// Quản lý toàn bộ giao diện người dùng (UI) bên trong sảnh chờ.
    /// Chịu trách nhiệm cập nhật dữ liệu từ Logic lên các thành phần hiển thị.
    /// </summary>
    public class LobbyUIManager : MonoBehaviour
    {
        [Header("Top Bar")]
        [SerializeField] private TextMeshProUGUI _txtRoomInfo;
        [SerializeField] private TextMeshProUGUI _txtRoomPassword;

        [Header("Map Config")]
        [SerializeField] private Image _imgMapIcon;
        [SerializeField] private TextMeshProUGUI _txtMapName;

        [Header("Player List")]
        [SerializeField] private Transform _playerListContent;
        [SerializeField] private GameObject _playerItemPrefab;

        [Header("Mission List")]
        [SerializeField] private Transform _missionListContent;
        [SerializeField] private GameObject _missionItemPrefab;

        [Header("Chat System")]
        [SerializeField] private Transform _chatContent;
        [SerializeField] private ScrollRect _chatScrollRect;
        [SerializeField] private TMP_InputField _inpChatMessage;
        [SerializeField] private GameObject _chatMePrefab;
        [SerializeField] private GameObject _chatThemPrefab;

        // --- ROOM INFO ---

        /// <summary>
        /// Cập nhật thông tin cơ bản của phòng chơi lên thanh tiêu đề.
        /// </summary>
        /// <param name="roomName">Tên phòng hiện tại.</param>
        /// <param name="hostName">Tên của chủ phòng (Master Client).</param>
        /// <param name="password">Mật khẩu phòng (nếu có).</param>
        public void SetRoomInfo(string roomName, string hostName, string password)
        {
            _txtRoomInfo.text = $"Room: {roomName} - Host: {hostName}";
            _txtRoomPassword.text = string.IsNullOrEmpty(password) ? "Public Room" : $"Pass: {password}";
        }

        /// <summary>
        /// Cập nhật hình ảnh và tên bản đồ đã chọn.
        /// </summary>
        public void UpdateMapDisplay(Sprite icon, string mapName)
        {
            _imgMapIcon.sprite = icon;
            _txtMapName.text = mapName;
        }

        // --- PLAYER LIST ---

        /// <summary>
        /// Làm mới danh sách hiển thị người chơi trong sảnh.
        /// </summary>
        /// <param name="players">Danh sách người chơi lấy từ Photon Network.</param>
        public void RefreshPlayerList(IEnumerable<Photon.Realtime.Player> players)
        {
            foreach (Transform child in _playerListContent) Destroy(child.gameObject);

            foreach (var player in players)
            {
                var item = Instantiate(_playerItemPrefab, _playerListContent);
                var texts = item.GetComponentsInChildren<TextMeshProUGUI>();

                if (texts.Length >= 2)
                {
                    texts[0].text = player.NickName; // Txt_Name

                    // Kiểm tra trạng thái Ready từ CustomProperties của Photon
                    bool isReady = player.CustomProperties.ContainsKey("isReady") && (bool)player.CustomProperties["isReady"];
                    texts[1].text = isReady ? "<color=green>READY</color>" : "<color=red>WAITING...</color>"; // Txt_Status
                }
            }
        }

        // --- MISSION LIST ---

        /// <summary>
        /// Thêm một dòng nhiệm vụ hằng ngày vào danh sách hiển thị.
        /// </summary>
        public void AddMission(string description, bool isDone)
        {
            var item = Instantiate(_missionItemPrefab, _missionListContent);
            var texts = item.GetComponentsInChildren<TextMeshProUGUI>();

            if (texts.Length >= 2)
            {
                texts[0].text = description; // Txt_MissionDesc
                texts[1].text = isDone ? "<color=green>Done</color>" : "In Progress"; // Txt_MissionProg
            }
        }

        // --- CHAT SYSTEM ---

        /// <summary>
        /// Thêm một dòng tin nhắn mới vào khung chat.
        /// </summary>
        /// <param name="sender">Tên người gửi.</param>
        /// <param name="message">Nội dung tin nhắn.</param>
        /// <param name="isMe">Xác định tin nhắn là của bản thân hay người khác để chọn UI phù hợp.</param>
        public void AddChatMessage(string sender, string message, bool isMe)
        {
            GameObject prefab = isMe ? _chatMePrefab : _chatThemPrefab;
            var chatItem = Instantiate(prefab, _chatContent);

            var texts = chatItem.GetComponentsInChildren<TextMeshProUGUI>();
            if (texts.Length >= 2)
            {
                // texts[0] = Txt_SenderName, texts[1] = Txt_Content
                texts[0].text = isMe ? "Tôi" : sender;
                texts[1].text = message;
            }

            Canvas.ForceUpdateCanvases();
            _chatScrollRect.verticalNormalizedPosition = 0f;
        }

        /// <summary> Lấy nội dung văn bản đang nhập. </summary>
        public string GetInputText() => _inpChatMessage.text;

        /// <summary> Xóa trắng ô nhập liệu sau khi gửi. </summary>
        public void ClearInput() => _inpChatMessage.text = string.Empty;

        /// <summary> Đưa con trỏ vào ô nhập liệu để bắt đầu gõ. </summary>
        public void FocusChat() => _inpChatMessage.ActivateInputField();
    }
}