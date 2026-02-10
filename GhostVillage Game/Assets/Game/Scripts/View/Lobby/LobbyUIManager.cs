using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System;
using Cysharp.Threading.Tasks;
using Photon.Pun;
using Photon.Realtime;

namespace Game.Scripts.UI.Lobby
{
    public class LobbyUIManager : MonoBehaviourPunCallbacks
    {
        #region UI References

        [Header("Top Bar")]
        [SerializeField] private TextMeshProUGUI _txtRoomInfo;
        [SerializeField] private TextMeshProUGUI _txtRoomPassword;

        [Header("Map Config (Main Lobby)")]
        [SerializeField] private GameObject _grpMapInfo;
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

        [Header("Interaction")]
        [SerializeField] private GameObject _interactPromptGo;
        [SerializeField] private TextMeshProUGUI _txtInteractPrompt;

        [Header("Management Modal")]
        [SerializeField] private GameObject _imgDimBG;
        [SerializeField] private GameObject _managementModal;
        [SerializeField] private FriendBoardItem[] _playerSlots;

        [Header("Map Picker Modal")]
        [SerializeField] private GameObject _mapPickerModal;
        [SerializeField] private Image _imgMapPreview;
        [SerializeField] private TextMeshProUGUI _txtMapTitle;
        [SerializeField] private TextMeshProUGUI _txtMapDesc;
        [SerializeField] private Button _btnNextMap;
        [SerializeField] private Button _btnPrevMap;
        [SerializeField] private Button _btnSelectMap;
        [SerializeField] private TextMeshProUGUI _txtSelectBtn;
        [SerializeField] private Button _btnClosePicker;

        [Header("Game Control")]
        [SerializeField] private TextMeshProUGUI _txtStartGamePrompt;

        [Header("ESC Menu")]
        [SerializeField] private GameObject _escMenuModal; // Kéo Grp_EscTab vào đây
        [SerializeField] private Button _btnExitLobby;     // Kéo Btn_ExitToLobbyList vào đây
        [SerializeField] private Button _btnCloseEscMenu;  // Kéo Btn_CloseModal vào đây

        #endregion

        #region Events

        public Action OnNextMapClicked;
        public Action OnPrevMapClicked;
        public Action OnSelectMapClicked;
        public Action OnClosePickerClicked;
        public Action OnExitLobbyRequest;

        #endregion

        #region Unity Lifecycle & Init

        private void Awake()
        {
            // Reset UI states
            SetInteractPrompt("", false);
            ShowManagementModal(false);

            if (_imgDimBG) _imgDimBG.SetActive(false);
            if (_mapPickerModal) _mapPickerModal.SetActive(false);
            if (_grpMapInfo) _grpMapInfo.SetActive(false);
            if (_txtStartGamePrompt) _txtStartGamePrompt.gameObject.SetActive(false);
            if (_escMenuModal) _escMenuModal.SetActive(false);

            // Bind Button Events
            if (_btnNextMap) _btnNextMap.onClick.AddListener(() => OnNextMapClicked?.Invoke());
            if (_btnPrevMap) _btnPrevMap.onClick.AddListener(() => OnPrevMapClicked?.Invoke());
            if (_btnSelectMap) _btnSelectMap.onClick.AddListener(() => OnSelectMapClicked?.Invoke());
            if (_btnClosePicker) _btnClosePicker.onClick.AddListener(() => OnClosePickerClicked?.Invoke());
            if (_btnExitLobby) _btnExitLobby.onClick.AddListener(() => OnExitLobbyRequest?.Invoke());
            if (_btnCloseEscMenu) _btnCloseEscMenu.onClick.AddListener(() => ShowEscMenu(false));
        }

        #endregion

        #region Photon Callbacks (View Updates)

        public override void OnPlayerEnteredRoom(Player newPlayer) => RefreshManagementList();
        public override void OnPlayerLeftRoom(Player otherPlayer) => RefreshManagementList();
        public override void OnMasterClientSwitched(Player newMasterClient) => RefreshManagementList();

        #endregion

        #region General Room UI

        public bool IsAnyUIOpen => (_managementModal != null && _managementModal.activeSelf) || IsChatFocused();

        public void SetRoomInfo(string roomName, string hostName, string password)
        {
            _txtRoomInfo.text = $"Room: {roomName} - Host: {hostName}";
            _txtRoomPassword.text = string.IsNullOrEmpty(password) ? "Public Room" : $"Pass: {password}";
        }

        #endregion

        #region Player List Logic

        /// <summary>
        /// Updates the side player list. Handles different status text for Host (START) vs Players (READY).
        /// </summary>
        public void RefreshPlayerList(IEnumerable<Player> players, bool canHostStart)
        {
            foreach (Transform child in _playerListContent) Destroy(child.gameObject);

            foreach (var player in players)
            {
                var item = Instantiate(_playerItemPrefab, _playerListContent);
                var texts = item.GetComponentsInChildren<TextMeshProUGUI>();

                if (texts.Length >= 2)
                {
                    texts[0].text = player.IsMasterClient ? $"[HOST] {player.NickName}" : player.NickName;

                    if (player.IsMasterClient)
                    {
                        // Host shows START status (Green if all ready, Grey if not)
                        texts[1].text = canHostStart ? "<color=green>START</color>" : "<color=#808080>START</color>";
                    }
                    else
                    {
                        // Players show READY status
                        bool isReady = player.CustomProperties.ContainsKey("isReady") && (bool)player.CustomProperties["isReady"];
                        texts[1].text = isReady ? "<color=green>READY</color>" : "<color=red>NOT READY</color>";
                    }
                }
            }
        }

        [Obsolete]
        private void RefreshManagementList()
        {
            if (_playerSlots == null || _playerSlots.Length == 0) return;

            var players = PhotonNetwork.PlayerList;
            for (int i = 0; i < _playerSlots.Length; i++)
            {
                if (i < players.Length) _playerSlots[i].Setup(players[i]);
                else _playerSlots[i].SetEmpty();
            }
        }

        #endregion

        #region Map UI Logic

        // --- Main Lobby Display ---

        public void UpdateLobbyMapInfo(string mapName, Sprite icon)
        {
            if (_grpMapInfo) _grpMapInfo.SetActive(true);
            if (_txtMapName) _txtMapName.text = mapName;

            if (_imgMapIcon)
            {
                _imgMapIcon.sprite = icon;
                _imgMapIcon.gameObject.SetActive(icon != null);
                if (icon == null) Debug.LogWarning($"[UI] Map {mapName} icon is missing.");
            }
        }

        public void ClearLobbyMapInfo()
        {
            if (_grpMapInfo) _grpMapInfo.SetActive(false);
        }

        // --- Map Picker Modal ---

        public void ShowMapPicker(bool show)
        {
            if (_mapPickerModal)
            {
                _mapPickerModal.SetActive(show);
                Cursor.lockState = show ? CursorLockMode.None : CursorLockMode.Locked;
                Cursor.visible = show;
            }
        }

        public void UpdateMapPickerUI(string title, string desc, Sprite icon)
        {
            if (_txtMapTitle) _txtMapTitle.text = title;
            if (_txtMapDesc) _txtMapDesc.text = desc;

            if (_imgMapPreview)
            {
                _imgMapPreview.sprite = icon;
                _imgMapPreview.gameObject.SetActive(icon != null);
            }
        }

        public void SetSelectButtonState(bool isSelected)
        {
            if (_txtSelectBtn)
            {
                _txtSelectBtn.text = isSelected ? "CANCEL" : "SELECT";
                _txtSelectBtn.color = isSelected ? Color.red : Color.green;
            }
        }

        #endregion

        #region Game Control UI

        public void ShowStartGamePrompt(bool show)
        {
            if (_txtStartGamePrompt)
            {
                _txtStartGamePrompt.gameObject.SetActive(show);
                if (show) _txtStartGamePrompt.text = "PRESS <color=yellow>[R]</color> TO START GAME";
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
                texts[0].text = isMe ? "Toi" : sender;
                texts[1].text = message;
            }

            await UniTask.Yield(PlayerLoopTiming.LastPostLateUpdate);
            if (_chatScrollRect) _chatScrollRect.verticalNormalizedPosition = 0f;
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
            if (UnityEngine.EventSystems.EventSystem.current)
                UnityEngine.EventSystems.EventSystem.current.SetSelectedGameObject(null);
        }

        public void FocusChat()
        {
            _inpChatMessage.Select();
            _inpChatMessage.ActivateInputField();
        }

        #endregion

        #region Interaction & Utils

        public void SetInteractPrompt(string message, bool visible)
        {
            if (_interactPromptGo)
            {
                _txtInteractPrompt.text = message;
                _interactPromptGo.SetActive(visible);
            }
        }

        public void ShowManagementModal(bool show)
        {
            if (_managementModal == null) return;

            _managementModal.SetActive(show);
            if (_imgDimBG) _imgDimBG.SetActive(show);

            Cursor.lockState = show ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = show;

            if (show) RefreshManagementList();
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

        public Sprite LoadSprite(string spriteName)
        {
            return Resources.Load<Sprite>($"MapIcons/{spriteName}");
        }

        #endregion

        // Trong LobbyUIManager.cs

        public override void OnEnable()
        {
            base.OnEnable(); // Nếu có
            InteractionEvents.OnInteractHover += HandleInteractHover;
        }

        public override void OnDisable()
        {
            base.OnDisable();
            InteractionEvents.OnInteractHover -= HandleInteractHover;
        }

        // Hàm xử lý khi nhận sự kiện
        private void HandleInteractHover(string msg, bool isVisible)
        {
            SetInteractPrompt(msg, isVisible);
        }

        public void ToggleEscMenu()
        {
            if (_escMenuModal == null) return;
            ShowEscMenu(!_escMenuModal.activeSelf);
        }

        public void ShowEscMenu(bool show)
        {
            if (_escMenuModal) _escMenuModal.SetActive(show);

            // Xử lý trỏ chuột
            Cursor.lockState = show ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = show;
        }

    }
}