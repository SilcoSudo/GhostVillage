using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System;
using Cysharp.Threading.Tasks;
using Photon.Pun;
using Photon.Realtime; // BẮT BUỘC có dòng này để dùng kiểu Player

namespace Game.Scripts.UI.Lobby
{
    /// <summary>
    /// Quản lý tập trung toàn bộ giao diện (UI) trong Scene Lobby.
    /// Kế thừa MonoBehaviourPunCallbacks để nhận các sự kiện mạng (Người vào/ra).
    /// </summary>
    public class LobbyUIManager : MonoBehaviourPunCallbacks
    {
        [Header("Top Bar")]
        [SerializeField] private TextMeshProUGUI _txtRoomInfo;
        [SerializeField] private TextMeshProUGUI _txtRoomPassword;

        [Header("Map Config")]
        [SerializeField] private Image _imgMapIcon;
        [SerializeField] private TextMeshProUGUI _txtMapName;

        [Header("Side Player List")]
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

        [Header("Interaction UI")]
        [SerializeField] private GameObject _interactPromptGo;
        [SerializeField] private TextMeshProUGUI _txtInteractPrompt;

        [Header("Board Management Modal")]
        [SerializeField] private GameObject _imgDimBG;
        [SerializeField] private GameObject _managementModal;
        [SerializeField] private FriendBoardItem[] _playerSlots;

        #region Photon Callbacks (Dành cho bản Build)

        // Các hàm này tự động chạy khi có biến động người chơi trong phòng
        [Obsolete]
        public override void OnPlayerEnteredRoom(Player newPlayer) => RefreshManagementList();
        [Obsolete]
        public override void OnPlayerLeftRoom(Player otherPlayer) => RefreshManagementList();
        [Obsolete]
        public override void OnMasterClientSwitched(Player newMasterClient) => RefreshManagementList();

        #endregion

        #region Room & Map Info

        public bool IsAnyUIOpen => (_managementModal != null && _managementModal.activeSelf) || IsChatFocused();

        [Obsolete]
        private void Awake()
        {
            SetInteractPrompt("", false);
            ShowManagementModal(false);
            if (_imgDimBG != null) _imgDimBG.SetActive(false);
        }

        public void SetRoomInfo(string roomName, string hostName, string password)
        {
            _txtRoomInfo.text = $"Room: {roomName} - Host: {hostName}";
            _txtRoomPassword.text = string.IsNullOrEmpty(password) ? "Public Room" : $"Pass: {password}";
        }

        public void UpdateMapDisplay(Sprite icon, string mapName)
        {
            _imgMapIcon.sprite = icon;
            _txtMapName.text = mapName;
        }

        #endregion

        #region Side Lists (Players & Missions)

        public void RefreshPlayerList(IEnumerable<Player> players)
        {
            foreach (Transform child in _playerListContent) Destroy(child.gameObject);

            foreach (var player in players)
            {
                var item = Instantiate(_playerItemPrefab, _playerListContent);
                var texts = item.GetComponentsInChildren<TextMeshProUGUI>();

                if (texts.Length >= 2)
                {
                    texts[0].text = player.NickName;
                    bool isReady = player.CustomProperties.ContainsKey("isReady") && (bool)player.CustomProperties["isReady"];
                    texts[1].text = isReady ? "<color=green>READY</color>" : "<color=red>WAITING...</color>";
                }
            }
        }

        public void AddMission(string description, bool isDone)
        {
            var item = Instantiate(_missionItemPrefab, _missionListContent);
            var texts = item.GetComponentsInChildren<TextMeshProUGUI>();

            if (texts.Length >= 2)
            {
                texts[0].text = description;
                texts[1].text = isDone ? "<color=green>Done</color>" : "In Progress";
            }
        }

        #endregion

        #region Chat System

        public async void AddChatMessage(string sender, string message, bool isMe)
        {
            GameObject prefab = isMe ? _chatMePrefab : _chatThemPrefab;
            var chatItem = Instantiate(prefab, _chatContent);

            var texts = chatItem.GetComponentsInChildren<TextMeshProUGUI>();
            if (texts.Length >= 2)
            {
                texts[0].text = isMe ? "Tôi" : sender;
                texts[1].text = message;
            }

            await UniTask.Yield(PlayerLoopTiming.LastPostLateUpdate);
            if (_chatScrollRect != null) _chatScrollRect.verticalNormalizedPosition = 0f;
        }

        public void BindSubmitEvent(Action<string> onSendMessage)
        {
            _inpChatMessage.onSubmit.AddListener((val) => onSendMessage?.Invoke(val));
        }

        public string GetInputText() => _inpChatMessage.text;
        public void ClearInput() => _inpChatMessage.text = string.Empty;
        public bool IsChatFocused() => _inpChatMessage.isFocused;

        public void DeFocusChat()
        {
            _inpChatMessage.DeactivateInputField();
            if (UnityEngine.EventSystems.EventSystem.current != null)
                UnityEngine.EventSystems.EventSystem.current.SetSelectedGameObject(null);
        }

        public void FocusChat()
        {
            _inpChatMessage.Select();
            _inpChatMessage.ActivateInputField();
        }

        #endregion

        #region Interaction & Management Board

        public void SetInteractPrompt(string message, bool visible)
        {
            if (_interactPromptGo != null)
            {
                _txtInteractPrompt.text = message;
                _interactPromptGo.SetActive(visible);
            }
        }

        [Obsolete]
        public void ShowManagementModal(bool show)
        {
            Debug.Log($"<color=orange>[UI Manager]</color> Gọi lệnh hiện Modal: {show}");

            if (_managementModal == null) return;

            _managementModal.SetActive(show);
            if (_imgDimBG != null) _imgDimBG.SetActive(show);

            if (show)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
                RefreshManagementList();
            }
            else
            {
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        [Obsolete]
        private void RefreshManagementList()
        {
            if (_playerSlots == null || _playerSlots.Length == 0) return;

            // Trong bản Build, danh sách này cần được nạp lại mỗi khi có callback
            var players = PhotonNetwork.PlayerList;

            for (int i = 0; i < _playerSlots.Length; i++)
            {
                if (i < players.Length)
                    _playerSlots[i].Setup(players[i]);
                else
                    _playerSlots[i].SetEmpty();
            }
        }

        #endregion
    }
}