using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System;
using Cysharp.Threading.Tasks;
using Photon.Pun;
using Photon.Realtime;
using Game.Script.UI; // Thêm thư viện GlobalUIManager
using VContainer;
using GhostVillage.Domain.Profile;     // Thêm thư viện Inject

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
        [SerializeField] private FriendBoardItem[] _playerSlots; // Cần kiểm tra script này có tồn tại không

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

        [Header("Perk Modal")]
        [SerializeField] private ManagePerkModalUI _managePerkModal;
        [Inject] private Game.Domain.Perk.Controllers.PerkController _perkController; // Tiêm ông cố nội này vào



        #endregion

        #region Dependencies (DI)

        // [THÊM MỚI] Inject Global UI để bật Setting
        [Inject] private GlobalUIManager _globalUI;
        [Header("Invite Modal")]
        [SerializeField] private InviteFriendModalUI _inviteFriendModal;

        // BỔ SUNG BIẾN CHO TUTORIAL
        [Header("Tutorial Modal")]
        [SerializeField] private TutorialModalUI _tutorialModal;

        // TIÊM RADAR VÀ CHAT VÀO ĐÂY ĐỂ TRUYỀN XUỐNG MODAL
        [Inject] private Game.Domain.Friend.Controllers.FriendController _friendController;
        [Inject] private Game.Core.Network.Chat.GlobalChatManager _chatManager;

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
            if (_inviteFriendModal != null) _inviteFriendModal.gameObject.SetActive(false);

            if (_tutorialModal != null && _tutorialModal.BtnClose != null)
            {
                _tutorialModal.BtnClose.onClick.AddListener(() => ShowTutorialModal(false));
            }
            if (_managePerkModal != null && _managePerkModal.BtnClose != null)
            {
                _managePerkModal.BtnClose.onClick.AddListener(() => ShowManagePerkModal(false));
            }

            // Bind Button Events
            if (_btnNextMap) _btnNextMap.onClick.AddListener(() => OnNextMapClicked?.Invoke());
            if (_btnPrevMap) _btnPrevMap.onClick.AddListener(() => OnPrevMapClicked?.Invoke());
            if (_btnSelectMap) _btnSelectMap.onClick.AddListener(() => OnSelectMapClicked?.Invoke());
            if (_btnClosePicker) _btnClosePicker.onClick.AddListener(() => OnClosePickerClicked?.Invoke());
        }

        #endregion

        #region Photon Callbacks (View Updates)

        public override void OnPlayerEnteredRoom(Player newPlayer) => RefreshManagementList();
        public override void OnPlayerLeftRoom(Player otherPlayer) => RefreshManagementList();
        public override void OnMasterClientSwitched(Player newMasterClient) => RefreshManagementList();

        #endregion

        #region General Room UI

        public bool IsAnyUIOpen =>
                    (_managementModal != null && _managementModal.activeSelf) ||
                    (_mapPickerModal != null && _mapPickerModal.activeSelf) ||
                    (_managePerkModal != null && _managePerkModal.gameObject.activeSelf) ||
                    (_tutorialModal != null && _tutorialModal.gameObject.activeSelf) ||
                    IsChatFocused() ||
                    (_inviteFriendModal != null && _inviteFriendModal.gameObject.activeSelf);

        public void SetRoomInfo(string roomName, string hostName, string password)
        {
            _txtRoomInfo.text = $"Room: {roomName} - Host: {hostName}";
            _txtRoomPassword.text = string.IsNullOrEmpty(password) ? "Public Room" : $"Pass: {password}";
        }

        #endregion


        #region Tutorial Modal Logic

        // HÀM MỚI CHUYÊN DÙNG ĐỂ BẬT TẮT HƯỚNG DẪN + XỬ LÝ CHUỘT
        public void ShowTutorialModal(bool show)
        {
            if (_tutorialModal == null) return;

            if (show) _tutorialModal.OpenModal();
            else _tutorialModal.CloseModal();

            if (_imgDimBG) _imgDimBG.SetActive(show);

            Cursor.lockState = show ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = show;
        }

        #endregion

        #region Player List Logic

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
                        texts[1].text = canHostStart ? "<color=green>START</color>" : "<color=#808080>START</color>";
                    }
                    else
                    {
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
                if (i < players.Length)
                {
                    _playerSlots[i].Setup(players[i]);
                }
                else
                {
                    // LỖ THỔNG TRỐNG -> TRUYỀN HÀM MỞ BẢNG MỜI VÀO ĐÂY
                    _playerSlots[i].SetEmpty(() =>
                    {
                        if (_inviteFriendModal != null)
                        {
                            _inviteFriendModal.OpenModal(_friendController, _chatManager);
                        }
                    });
                }
            }
        }

        #endregion

        #region Map UI Logic

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

        // Truyền Controller vào cho Modal lúc bật lên luôn
        public void ShowManagePerkModal(bool show)
        {
            if (_managePerkModal == null) return;

            if (show)
            {
                _managePerkModal.Init(_perkController);
                _managePerkModal.OpenModal();
            }
            else
            {
                _managePerkModal.CloseModal();
            }

            if (_imgDimBG) _imgDimBG.SetActive(show);

            Cursor.lockState = show ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = show;
        }

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

            if (show)
            {

                if (_inviteFriendModal != null) _inviteFriendModal.gameObject.SetActive(false);

                RefreshManagementList();
            }
        }

        // Thay thế hàm AddMission cũ bằng hàm này
        // Cập nhật lại hàm Render ở LobbyUIManager
        public void RenderDailyQuests(List<QuestItemDTO> dailyQuests)
        {
            // Dọn dẹp content cũ
            foreach (Transform child in _missionListContent) Destroy(child.gameObject);

            if (dailyQuests == null || dailyQuests.Count == 0) return;

            foreach (var quest in dailyQuests)
            {
                var itemGo = Instantiate(_missionItemPrefab, _missionListContent);

                // Reset scale để UI không bị vỡ (bệnh nan y của ScrollView Unity)
                if (itemGo.TryGetComponent<RectTransform>(out var rect))
                {
                    rect.localScale = Vector3.one;
                }

                // Trỏ tới đúng cái Script mới tui vừa viết
                if (itemGo.TryGetComponent<Item_LobbyDailyQuestUI>(out var ui))
                {
                    // Truyền data vào, đéo cần truyền sự kiện bấm nút nữa
                    ui.Setup(quest);
                }
            }
        }

        public Sprite LoadSprite(string spriteName)
        {
            return Resources.Load<Sprite>($"MapIcons/{spriteName}");
        }

        #endregion

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

        private void HandleInteractHover(string msg, bool isVisible)
        {
            SetInteractPrompt(msg, isVisible);
        }

    }
}