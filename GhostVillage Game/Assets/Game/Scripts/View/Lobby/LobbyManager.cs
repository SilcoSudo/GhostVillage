using UnityEngine;
using Photon.Pun;
using Photon.Realtime;
using VContainer;
using Game.Script.UI;
using Cysharp.Threading.Tasks;
using System.Collections.Generic;
using UnityEngine.InputSystem;
using Game.Domain.Map.Services;
using Game.Domain.Map.DTOs;
using System.Linq;
using Hashtable = ExitGames.Client.Photon.Hashtable;
using Game.Scripts.View.Lobby.Session;
using Game.Core.Scene;
using Game.Core.Network;
using VContainer.Unity;

namespace Game.Scripts.UI.Lobby
{
    public class LobbyManager : MonoBehaviourPunCallbacks
    {
        #region Dependencies & Fields

        [Header("Networking Setup")]
        [SerializeField] private string _playerPrefabName = "Player";
        [SerializeField] private List<Transform> _spawnPoints;
        [SerializeField] private Camera _sceneCamera;

        [Inject] private GlobalUIManager _globalUI;
        [Inject] private LobbyUIManager _uiManager;
        [Inject] private IMapDataService _mapService;
        [Inject] private INetworkService _network;
        [Inject] private ISceneLoaderService _sceneLoader;

        [Inject] private IObjectResolver _resolver;

        private List<MapConfigDTO> _cachedMaps = new List<MapConfigDTO>();
        private int _currentMapIndex = 0;
        private const string MAP_KEY = "mapId";
        private const string READY_KEY = "isReady";

        #endregion

        #region Unity Lifecycle

        private async void Start()
        {
            _globalUI.ShowLoading(true);
            BindUIEvents();

            _globalUI.OnLobbyExitClicked = HandleExitLobby;

            try
            {
                // Wait for room connection and map data fetch
                await UniTask.WhenAll(WaitForInRoom(), FetchLobbyResources());



                // --- [LOGIC RESET] ---
                if (PhotonNetwork.IsMasterClient)
                {
                    Debug.Log("[LobbyManager] Master: Dọn dẹp chiến trường cũ và Reset Room...");

                    // 1. DỌN RÁC SCENE CŨ: Xóa tất cả các object có PhotonView (như Monster, Item) đã sinh ra ở scene trước
                    // Lưu ý: Chỉ dùng hàm này nếu bạn chắc chắn Lobby không có các object cần thiết bị dính đạn.
                    // Thường thì khi load scene, các object cũ tự hủy rồi, nhưng làm cái này để dọn dẹp các lệnh Instantiate còn kẹt trên server.
                    PhotonNetwork.DestroyAll();

                    // Dọn dẹp danh sách Event/RPC bị treo trên Server. 
                    // Quan trọng: Nó xóa sạch Event đệm, giúp người mới vào không bị gọi lại đống đồ cũ.
                    PhotonNetwork.RemoveRPCsInGroup(0); // Nếu bạn ko dùng Interest Group, mặc định là 0
                                                        // PhotonNetwork.OpCleanRpcBuffer(photonView); // Hoặc dùng hàm này nếu có PhotonView cụ thể

                    // 2. Mở lại phòng
                    PhotonNetwork.CurrentRoom.IsOpen = true;
                    PhotonNetwork.CurrentRoom.IsVisible = true;

                    // 3. Reset các Custom Properties (Xóa State cũ)
                    Hashtable resetProps = new Hashtable
                {
                    { "G_State", null }, 
                    // { MAP_KEY, null } // Bỏ comment nếu muốn bắt chọn lại Map
                };
                    PhotonNetwork.CurrentRoom.SetCustomProperties(resetProps);

                    // 4. Un-ready toàn bộ người chơi trong phòng
                    foreach (var p in PhotonNetwork.PlayerList)
                    {
                        Hashtable unreadyProps = new Hashtable { { READY_KEY, false } };
                        p.SetCustomProperties(unreadyProps);
                    }
                }
                // ------------------------------------

                // Sync initial state for late joiners
                UpdateMapUIFromNetwork();
                RefreshStartPrompt();
            }
            catch (System.Exception e) { Debug.LogError($"[LobbyManager] Error: {e.Message}"); }

            if (_uiManager != null)
            {
                _uiManager.BindSubmitEvent(HandleChatInput);
                _uiManager.OnExitLobbyRequest += HandleExitLobby;
                SetupRoomUI();
            }
            else
            {
                Debug.LogError("[LobbyManager] UI Manager is NULL!");
            }

            _globalUI.ShowLoading(false);
            SpawnPlayer();
        }

        private void Update()
        {
            // Kiểm tra an toàn thiết bị nhập liệu
            if (Keyboard.current == null || _uiManager == null) return;

            // --- 1. ESC Key Logic ---
            if (Keyboard.current.escapeKey.wasPressedThisFrame)
            {
                if (_uiManager.IsChatFocused())
                {
                    _uiManager.DeFocusChat();
                }
                else
                {
                    if (_globalUI.IsEscMenuOpen())
                    {
                        _globalUI.CloseEscMenu(true); // Lobby khóa chuột khi đóng ESC
                    }
                    else
                    {
                        _globalUI.OpenEscMenu(GlobalUIManager.EscMenuType.Lobby, true);
                    }
                }
                return;
            }

            // --- Chặn các phím khác nếu Menu đang mở ---
            if (_globalUI.IsEscMenuOpen()) return;

            // --- 2. Chat Toggle Logic (Enter) ---
            if (Keyboard.current.enterKey.wasPressedThisFrame)
            {
                // Nếu Menu ESC đang mở thì không cho chat (Optional: tùy trải nghiệm game)
                // if (_uiManager.IsEscMenuOpen) return; 

                if (!_uiManager.IsChatFocused())
                    _uiManager.FocusChat();
                else
                    HandleChatInput(_uiManager.GetInputText());
            }

            // --- 3. R Key Logic (Ready / Start Game) ---
            if (Keyboard.current.rKey.wasPressedThisFrame)
            {
                // Chặn nếu đang gõ chat
                if (_uiManager.IsChatFocused()) return;

                if (PhotonNetwork.IsMasterClient)
                {
                    // Host Logic: Start Game if conditions met
                    if (IsEveryoneElseReady() && HasMapSelected())
                        StartGameWithSecurityCheck();
                    else
                        Debug.Log("Host cannot start: Waiting for map or players.");
                }
                else
                {
                    // Client Logic: Toggle Ready status
                    ToggleReady();
                }
            }
        }

        public override void OnDisable()
        {
            base.OnDisable();
            // RÚT ỐNG RA KHI RỜI SCENE
            if (_globalUI != null) _globalUI.OnLobbyExitClicked -= HandleExitLobby;
        }

        #endregion

        #region Map Logic (Selection & Sync)

        private void BindUIEvents()
        {
            if (_uiManager == null) return;

            _uiManager.OnNextMapClicked += () => ChangeMapSelection(1);
            _uiManager.OnPrevMapClicked += () => ChangeMapSelection(-1);
            _uiManager.OnClosePickerClicked += () => _uiManager.ShowMapPicker(false);

            _uiManager.OnSelectMapClicked += () =>
            {
                if (_cachedMaps.Count == 0 || !PhotonNetwork.IsMasterClient) return;

                var selectedMap = _cachedMaps[_currentMapIndex];

                // Sync selected map ID to Room Properties
                Hashtable props = new Hashtable { { MAP_KEY, selectedMap.identityConfig.mapId } };
                PhotonNetwork.CurrentRoom.SetCustomProperties(props);

                Debug.Log($"Selected Map: {selectedMap.identityConfig.displayName}");
                _uiManager.ShowMapPicker(false);
            };
        }

        private void ChangeMapSelection(int direction)
        {
            if (_cachedMaps.Count == 0) return;

            _currentMapIndex += direction;
            if (_currentMapIndex >= _cachedMaps.Count) _currentMapIndex = 0;
            if (_currentMapIndex < 0) _currentMapIndex = _cachedMaps.Count - 1;

            UpdatePickerUI();
        }

        private void UpdatePickerUI()
        {
            var map = _cachedMaps[_currentMapIndex];
            var info = map.identityConfig;
            Sprite icon = _uiManager.LoadSprite(info.thumbnailUrl);
            _uiManager.UpdateMapPickerUI(info.displayName, info.shortDescription, icon);
        }

        public void OpenMapPicker()
        {
            if (_cachedMaps.Count == 0) return;
            UpdatePickerUI();
            _uiManager.ShowMapPicker(true);
        }

        #endregion

        #region Photon Callbacks & Sync Logic

        public override void OnRoomPropertiesUpdate(Hashtable propertiesThatChanged)
        {
            if (propertiesThatChanged.ContainsKey(MAP_KEY))
            {
                UpdateMapUIFromNetwork();
                RefreshStartPrompt(); // Re-check start conditions on map change
            }
        }

        public override void OnPlayerPropertiesUpdate(Player targetPlayer, Hashtable changedProps)
        {
            if (changedProps.ContainsKey(READY_KEY))
            {
                RefreshStartPrompt(); // Re-check start conditions on player ready change
            }
        }

        public override void OnPlayerEnteredRoom(Player newPlayer)
        {
            Debug.Log($"[Lobby] Player joined: {newPlayer.NickName}");
            RefreshStartPrompt(); // Re-check because new player is not ready
        }

        public override void OnPlayerLeftRoom(Player otherPlayer)
        {
            Debug.Log($"[Lobby] Player left: {otherPlayer.NickName}");
            RefreshStartPrompt();
        }

        private void UpdateMapUIFromNetwork()
        {
            if (PhotonNetwork.CurrentRoom == null) return;

            if (PhotonNetwork.CurrentRoom.CustomProperties.TryGetValue(MAP_KEY, out object id))
            {
                string mapId = (string)id;
                if (string.IsNullOrEmpty(mapId))
                {
                    _uiManager.ClearLobbyMapInfo();
                    return;
                }

                var config = _cachedMaps.FirstOrDefault(m => m.identityConfig.mapId == mapId);

                if (config != null)
                {
                    Sprite icon = _uiManager.LoadSprite(config.identityConfig.thumbnailUrl);
                    _uiManager.UpdateLobbyMapInfo(config.identityConfig.displayName, icon);

                    // --- LOGIC MỚI: LƯU VÀO HỘP CHỨA ---
                    // Lưu Config vào Singleton để mang sang Scene Game
                    if (GameDataTransfer.Instance != null)
                    {
                        GameDataTransfer.Instance.SetMapConfig(config);
                    }
                    else
                    {
                        Debug.LogError("Chưa tạo GameDataTransfer trong Scene!");
                    }
                    // -------------------------------------
                }
            }
        }

        #endregion

        #region Game Flow Logic (Ready & Start)

        private void RefreshStartPrompt()
        {
            bool canStart = IsEveryoneElseReady() && HasMapSelected();

            if (_uiManager != null)
            {
                _uiManager.RefreshPlayerList(PhotonNetwork.PlayerList, canStart);

                if (PhotonNetwork.IsMasterClient)
                    _uiManager.ShowStartGamePrompt(canStart);
                else
                    _uiManager.ShowStartGamePrompt(false);
            }
        }

        private bool IsEveryoneElseReady()
        {
            // Check all players except Host
            return PhotonNetwork.PlayerList
                .Where(p => !p.IsMasterClient)
                .All(p => p.CustomProperties.ContainsKey(READY_KEY) && (bool)p.CustomProperties[READY_KEY]);
        }

        private bool HasMapSelected()
        {
            return PhotonNetwork.CurrentRoom.CustomProperties.ContainsKey(MAP_KEY);
        }

        private void ToggleReady()
        {
            bool currentReady = false;
            if (PhotonNetwork.LocalPlayer.CustomProperties.TryGetValue(READY_KEY, out object r))
                currentReady = (bool)r;

            Hashtable props = new Hashtable { { READY_KEY, !currentReady } };
            PhotonNetwork.LocalPlayer.SetCustomProperties(props);
        }

        private void StartGameWithSecurityCheck()
        {
            // Final Security Check before loading level
            foreach (var p in PhotonNetwork.PlayerList)
            {
                bool ready = p.CustomProperties.ContainsKey(READY_KEY) && (bool)p.CustomProperties[READY_KEY];

                // Kick players who unreadied at the last second (except Host)
                if (!p.IsMasterClient && !ready)
                {
                    Debug.Log($"[Security] Kicking {p.NickName} for not being ready.");
                    PhotonNetwork.CloseConnection(p);
                    return;
                }
            }

            // Lock Room and Load Scene
            PhotonNetwork.CurrentRoom.IsOpen = false;
            PhotonNetwork.CurrentRoom.IsVisible = false;

            string mapId = (string)PhotonNetwork.CurrentRoom.CustomProperties[MAP_KEY];
            var config = _cachedMaps.First(m => m.identityConfig.mapId == mapId);

            Debug.Log($"Loading Scene: {config.identityConfig.sceneName}");
            PhotonNetwork.LoadLevel(config.identityConfig.sceneName);
        }

        #endregion

        #region Helper Methods (Chat, Setup, Spawn)

        private async UniTask FetchLobbyResources()
        {
            var maps = await _mapService.FetchAllMaps();
            if (maps != null && maps.Count > 0)
            {
                _cachedMaps = maps;
                Debug.Log($"Loaded {_cachedMaps.Count} maps.");
            }
            _uiManager.AddMission("Sống sót qua đêm đầu tiên", false);
        }

        private void SetupRoomUI()
        {
            var room = PhotonNetwork.CurrentRoom;
            if (room == null) return;
            string pass = room.CustomProperties.ContainsKey("pw") ? (string)room.CustomProperties["pw"] : "";
            _uiManager.SetRoomInfo(room.Name, PhotonNetwork.MasterClient.NickName, pass);

            RefreshStartPrompt();
        }

        private void HandleChatInput(string message)
        {
            if (!string.IsNullOrWhiteSpace(message))
                photonView.RPC("RPC_ReceiveChatMessage", RpcTarget.All, PhotonNetwork.LocalPlayer.NickName, message);

            _uiManager.ClearInput();
            _uiManager.DeFocusChat();
        }

        [PunRPC]
        public void RPC_ReceiveChatMessage(string senderName, string message)
        {
            bool isMe = senderName == PhotonNetwork.LocalPlayer.NickName;
            _uiManager.AddChatMessage(senderName, message, isMe);
        }

        private async UniTask WaitForInRoom()
        {
            while (!PhotonNetwork.InRoom) await UniTask.Yield();
        }

        private void SpawnPlayer()
        {
            if (PhotonNetwork.InRoom)
            {
                int spawnIndex = (PhotonNetwork.LocalPlayer.ActorNumber - 1) % _spawnPoints.Count;
                Transform spawn = _spawnPoints[spawnIndex];

                // 1. Dùng Photon để sinh ra Player trên mạng
                GameObject playerObj = PhotonNetwork.Instantiate(_playerPrefabName, spawn.position, spawn.rotation);

                // 2. NGAY LẬP TỨC: Ép VContainer quét thằng Player này và Inject các thứ (như PlayerInputActions) vào nó!
                if (playerObj != null && _resolver != null)
                {
                    _resolver.InjectGameObject(playerObj);
                    Debug.Log("[LobbyManager] Đã Inject VContainer vào Player vừa sinh ra.");
                }

                if (_sceneCamera) _sceneCamera.gameObject.SetActive(false);
            }
        }

        private void OnDestroy()
        {
            if (_uiManager != null)
            {
                _uiManager.OnExitLobbyRequest -= HandleExitLobby;
            }
        }

        private void HandleExitLobby()
        {
            Debug.Log("[LobbyManager] User requested exit. Leaving room...");
            // Hiện Loading
            _globalUI.ShowLoading(true);

            // Gọi Photon rời phòng
            PhotonNetwork.LeaveRoom();
        }

        // 5. Callback của Photon (Script phải kế thừa MonoBehaviourPunCallbacks)
        public override void OnLeftRoom()
        {
            Debug.Log("[LobbyManager] Left room successfully. Loading LobbyListScene...");

            // Chuyển cảnh về danh sách phòng
            _sceneLoader.LoadSceneAsync("LobbyListScene");
        }

        #endregion
    }
}