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
using Game.Domain.Perk.Controllers;

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
        [Inject] private PerkController _perkController;
        [Inject] private ProfileService _profileService;
        [Inject] private GameSession _session;

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
                await UniTask.WhenAll(
                    WaitForInRoom(),
                    FetchLobbyResources(),
                    FetchAndLoadPerksToPhoton(),
                    FetchAndRenderDailyQuests()
                );

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
                        _globalUI.CloseEscMenu(); // Lobby khóa chuột khi đóng ESC
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

        #region Perk Logic (Chạy Ngầm)

        // HÀM MỚI: TẢI PERK VÀ ĐÓNG GÓI VÀO PHOTON
        private async UniTask FetchAndLoadPerksToPhoton()
        {
            if (_perkController == null) return;

            await _perkController.FetchPerkDataAsync();
            var data = _perkController.PerkData.Value;

            if (data == null || data.equippedPerks == null || data.equippedPerks.Count == 0)
            {
                Debug.Log("<color=yellow>[LobbyManager]</color> Người chơi này không mặc Perk nào.");
                return;
            }

            // 1. Khởi tạo Base Stats mặc định
            float p_MaxStam = 1f;
            float p_StamRegen = 1f;
            float p_SprintDrain = 1f;
            float p_BattDrain = 1f;
            float p_Vis = 1f;
            float p_Preserve = 0f;
            float p_RevSpeed = 1f;

            // Cờ cho các kỹ năng đặc biệt
            bool p_XRay = false;
            bool p_AutoRevive = false;
            bool p_RelicBearer = false;
            bool p_AncestralVow = false;

            // 2. Quét qua file JSON và tính toán
            foreach (var perkId in data.equippedPerks)
            {
                var perkDetail = data.unlockedPerksDetails.Find(p => p.perkId == perkId);
                if (perkDetail != null && perkDetail.modifiers != null)
                {
                    var mod = perkDetail.modifiers;

                    // Nhóm tính % (Multiplier)
                    if (mod.maxStaminaMult > 0) p_MaxStam *= mod.maxStaminaMult;
                    if (mod.staminaRegenMult > 0) p_StamRegen *= mod.staminaRegenMult;
                    if (mod.sprintStaminaDrainMult > 0) p_SprintDrain *= mod.sprintStaminaDrainMult;
                    if (mod.batteryDrainMult > 0) p_BattDrain *= mod.batteryDrainMult;
                    if (mod.bossDetectionRangeMult > 0) p_Vis *= mod.bossDetectionRangeMult;
                    if (mod.reviveSpeedMult > 0) p_RevSpeed *= mod.reviveSpeedMult;

                    // Nhóm cộng dồn (Additive)
                    if (mod.preserveItemChance > 0) p_Preserve += mod.preserveItemChance;

                    // Nhóm Cờ (Booleans) cho kỹ năng kích hoạt
                    if (perkId == "PERK_EPIC_PROPHETIC_SIGHT") p_XRay = true;
                    if (perkId == "PERK_EPIC_SPECTRAL_REFLEX") p_AutoRevive = true;
                    if (perkId == "PERK_RARE_RELIC_BEARER") p_RelicBearer = true;
                    if (perkId == "PERK_RARE_ANCESTRAL_VOW") p_AncestralVow = true;
                }
            }

            // 3. Nạp vào Balo Photon bằng ĐÚNG TÊN KEY mà PlayerStatsManager chờ
            var props = new Hashtable
    {
        { "Perk_IDs", data.equippedPerks.ToArray() },
        { "P_MaxStam", p_MaxStam },
        { "P_StamRegen", p_StamRegen },
        { "P_SprintDrain", p_SprintDrain },
        { "P_BattDrain", p_BattDrain },
        { "P_Vis", p_Vis },
        { "P_Preserve", p_Preserve },
        { "P_RevSpeed", p_RevSpeed },
        { "P_XRay", p_XRay },
        { "P_AutoRevive", p_AutoRevive },
        { "P_RelicBearer", p_RelicBearer },
        { "P_AncestralVow", p_AncestralVow }
    };

            PhotonNetwork.LocalPlayer.SetCustomProperties(props);
            Debug.Log($"<color=green>[LobbyManager]</color> Đã nạp {data.equippedPerks.Count} Perks. X-Ray: {p_XRay}");
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
            if (_cachedMaps == null || _cachedMaps.Count == 0)
            {
                Debug.LogWarning("⚠️ [Lobby] Chưa tải được danh sách Map, không thể mở Picker!");
                return;
            }
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
                        GameDataTransfer.Instance.SetMapId(config.identityConfig.mapId);
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

            string requestedScene = config.identityConfig.sceneName;
            string playableScene = ResolvePlayableSceneName(requestedScene);

            if (!Application.CanStreamedLevelBeLoaded(playableScene))
            {
                Debug.LogError($"[LobbyManager] Scene not found in Build Profiles: requested='{requestedScene}', resolved='{playableScene}'. Add scene to Build Profiles.");
                _globalUI.ShowError("Scene Not Found", $"Scene '{playableScene}' not in Build Profiles. GO to File > Build Profiles to add scene.");
                return;
            }

            Debug.Log($"Loading Scene: {playableScene} (requested: {requestedScene})");

            if (_globalUI != null)
            {
                _globalUI.ShowLoading(true, "Loading map...");
            }

            PhotonNetwork.LoadLevel(playableScene);
        }

        private string ResolvePlayableSceneName(string sceneName)
        {
            if (string.IsNullOrWhiteSpace(sceneName))
                return sceneName;

            if (Application.CanStreamedLevelBeLoaded(sceneName))
                return sceneName;

            // Backward-compat aliases from older map config values.
            if (sceneName == "Map_Ong_Ke")
                return "Scene_Game_OngKe";

            return sceneName;
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

        // =========================================================
        // [MỚI] NHẬN LỆNH KICK TỪ CHỦ PHÒNG VÀ TỰ BAY MÀU
        // =========================================================
        [PunRPC]
        public void RPC_GetKicked()
        {
            Debug.Log("<color=red>[Photon] Bạn đã bị chủ phòng Kick!</color>");

            // Ngắt kết nối Voice trước để tránh lỗi hóc xương
            var voiceClient = Photon.Voice.PUN.PunVoiceClient.Instance;
            if (voiceClient != null && voiceClient.Client.InRoom)
            {
                voiceClient.Client.OpLeaveRoom(false);
            }

            // Tự động out phòng. Khi out xong, hàm OnLeftRoom (đã có sẵn ở trên) sẽ tự đá sếp về màn LobbyList!
            PhotonNetwork.LeaveRoom();
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
            if (!PhotonNetwork.InRoom)
            {
                _sceneLoader.LoadSceneAsync("LobbyListScene");
                return;
            }
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

        // =========================================================
        // [MỚI] LOGIC KÉO DAILY QUEST VỀ LOBBY ĐỂ LÀM TO-DO LIST
        // =========================================================
        private async UniTask FetchAndRenderDailyQuests()
        {
            if (_profileService == null || _uiManager == null) return;

            try
            {
                // Gọi API lấy Data. Có Inject GameSession rồi nên móc Token ra xài thoải mái!
                var profileData = await _profileService.GetAchievementsAsync(_session.Token);

                if (profileData != null && profileData.dailyQuests != null)
                {
                    _uiManager.RenderDailyQuests(profileData.dailyQuests);
                    Debug.Log($"<color=cyan>[LobbyManager]</color> Đã kéo thành công {profileData.dailyQuests.Count} nhiệm vụ dán lên bảng To-Do!");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogWarning($"<color=orange>[LobbyManager]</color> Lỗi nạp bảng nhiệm vụ: {e.Message}");
            }
        }

        #endregion
    }
}