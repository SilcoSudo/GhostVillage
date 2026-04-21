using System.Collections.Generic;
using Game.Domain.Map.DTOs;
using Game.Scripts.Core.Game;
using Game.Scripts.Gameplay.Core;
using Game.Scripts.View.Lobby.Session;
using Photon.Pun;
using UnityEngine;
using VContainer;
using Game.Domain.Match.Services;
using Game.Domain.Match.DTO;
using Cysharp.Threading.Tasks;
using System.Collections;
using Game.Scripts.Gameplay.Result;
using Game.Domain.Map.Services;
using Game.Core.Network;
using Game.Script.UI;

// Lưu ý: Đảm bảo bạn đã có các Enum và file GameplayEvents.cs như đã bàn trước đó
public class GameManager : MonoBehaviourPunCallbacks
{
    [Header("Databases")]
    [SerializeField] private Game.Core.Database.GameResourceDatabaseSO _resourceDB;

    // --- STATE MACHINE ---
    public GameState CurrentState { get; private set; } = GameState.Initializing;
    private const string KEY_GAME_STATE = "G_State";

    private Dictionary<int, PlayerMatchStatus> _playerStatuses = new Dictionary<int, PlayerMatchStatus>();
    private System.DateTime _matchStartTime; // Biến lưu giờ bắt đầu

    // --- DEPENDENCY INJECTION (VContainer) ---
    private MapDataManager _mapData;
    private IMapDataService _mapDataService;
    private ItemSpawnerManager _itemSpawner;
    private MonsterSpawnerManager _monsterSpawner;
    private PuzzleSpawnerManager _puzzleSpawner;
    private PlayerSpawner _playerSpawner;
    private ObjectiveManager _objectiveManager;
    private MatchDataService _matchDataService;
    private GameplayUIManager _uiManager;
    private MatchStatisticManager _statisticManager;
    private MoonEventManager _moonManager;
    private MatchRoute _currentMatchRoute = MatchRoute.Lose; // Mặc định là thua
    private bool _isLocalDataReady = false;

    private GameSession _session;
    private ProfileService _profileService;

    // VContainer sẽ tự động điền các biến này vào khi Prefab GameContext được khởi tạo
    [Inject]
    public void Construct(
        MapDataManager mapData,
        IMapDataService mapDataService,
        ItemSpawnerManager itemSpawner,
        MonsterSpawnerManager monsterSpawner,
        PuzzleSpawnerManager puzzleSpawner,
        PlayerSpawner playerSpawner,
        ObjectiveManager objectiveManager,
        MatchDataService matchDataService,
        GameplayUIManager uiManager,
        MatchStatisticManager statisticManager,
        GameSession session,
        ProfileService profileService,
        MoonEventManager moonManager
    )
    {
        _mapData = mapData;
        _mapDataService = mapDataService;
        _itemSpawner = itemSpawner;
        _monsterSpawner = monsterSpawner;
        _puzzleSpawner = puzzleSpawner;
        _playerSpawner = playerSpawner;
        _objectiveManager = objectiveManager;
        _matchDataService = matchDataService;
        _uiManager = uiManager;
        _statisticManager = statisticManager;
        _session = session;
        _profileService = profileService;
        _moonManager = moonManager;
    }

    // --- UNITY LIFECYCLE ---

    // Thay void Start bằng async void Start
    private async void Start()
    {
        Debug.Log("<color=cyan>[GameManager]</color> Khởi động vòng lặp Game...");

        // 1. Initializing (Chạy cục bộ trên mỗi máy)
        SetLocalState(GameState.Initializing);

        string mapIdToLoad = "MAP_01_ONG_KE"; // ID dự phòng nếu test offline

        // Lấy VÉ TÀU từ Lobby
        if (GameDataTransfer.Instance != null && !string.IsNullOrEmpty(GameDataTransfer.Instance.SelectedMapId))
        {
            mapIdToLoad = GameDataTransfer.Instance.SelectedMapId;
        }
        else
        {
            Debug.LogWarning("⚠️ Không tìm thấy GameDataTransfer (Chạy trực tiếp?). Dùng Config Mặc định/Mock.");
        }

        // --- GỌI MAP DATA SERVER CHỞ CỤC MEGA DTO VỀ ---
        Debug.Log($"[GameManager] Đang tải Mega Game Data cho map: {mapIdToLoad}");
        AggregatedGameDataDTO dataToLoad = await _mapDataService.FetchGameData(mapIdToLoad);

        if (_moonManager != null && dataToLoad?.stats?.moonEvents != null)
        {
            _moonManager.Initialize(dataToLoad.stats.moonEvents);
        }
        else
        {
            Debug.LogWarning("⚠️ [GameManager] MoonEventManager hoặc dữ liệu MoonEvent chưa sẵn sàng!");
        }

        // Nhét cục Data to vào MapDataManager
        if (_mapData != null && dataToLoad != null)
        {
            _mapData.InitializeMap(dataToLoad);
        }
        else
        {
            Debug.LogError(" [GameManager] MapData hoặc Data API chưa được Inject!");
        }

        // [FIX QUAN TRỌNG] TẤT CẢ MỌI NGƯỜI ĐỀU PHẢI BẬT TRACKER
        if (_statisticManager != null)
        {
            _statisticManager.InitializeTracker();
        }
        else
        {
            Debug.LogError(" [GameManager] MatchStatisticManager chưa được Inject!");
        }

        _isLocalDataReady = true;

        if (_playerSpawner != null)
        {
            _playerSpawner.SpawnLocalPlayer(_mapData);
            Debug.Log("<color=green>[GameManager] Đã tự spawn Local Player thành công!</color>");
        }
        else
        {
            Debug.LogError("❌ [GameManager] PlayerSpawner chưa được Inject!");
        }

        // 2. Spawn World (Chỉ Master Client thực hiện để tránh trùng lặp)
        if (PhotonNetwork.IsMasterClient)
        {
            _matchStartTime = System.DateTime.UtcNow;

            foreach (var p in PhotonNetwork.PlayerList)
            {
                _playerStatuses[p.ActorNumber] = PlayerMatchStatus.Playing;
            }

            // Lấy riêng cái MapConfig ra để chạy Spawner
            var config = _mapData.CurrentMapConfig;
            if (config != null)
            {
                Debug.Log("[GameManager] Config found. Spawning systems...");

                // --- TRUYỀN DB VÀO CÁC HÀM SPAWN ---
                if (_itemSpawner != null) _itemSpawner.SpawnItems(config, _mapData, _resourceDB);
                if (_monsterSpawner != null) _monsterSpawner.SpawnMonsters(config.monsterSystemConfig, _mapData, _resourceDB, _moonManager);
                if (_puzzleSpawner != null) _puzzleSpawner.SpawnPuzzles(config.puzzleConfig, _mapData, _resourceDB);

                _objectiveManager.Initialize();
            }
            else Debug.LogError("[GameManager] Config is NULL!");

            // Master chuyển trạng thái sang Chờ Người Chơi
            UpdateNetworkState(GameState.Playing);
        }
        else
        {
            Debug.Log("<color=blue>[GameManager]</color> Tôi là Client thường, chờ Master điều phối...");
            // Client con: Nếu vào sau, tự động đồng bộ State từ Server về
            if (PhotonNetwork.CurrentRoom != null && PhotonNetwork.CurrentRoom.CustomProperties.ContainsKey(KEY_GAME_STATE))
            {
                GameState serverState = (GameState)(int)PhotonNetwork.CurrentRoom.CustomProperties[KEY_GAME_STATE];
                SetLocalState(serverState);
            }
        }

        // Lắng nghe sự kiện "Hoàn thành tất cả nhiệm vụ" để chuyển pha Chạy Trốn
        GameplayEvents.OnAltarActivated += HandleEscapePhaseTrigger;
        GameplayEvents.OnLocalPlayerRequestEscape += HandleLocalPlayerEscapeRequest;
    }

    public override void OnEnable()
    {
        base.OnEnable();
        GameplayEvents.OnAltarActivated += HandleEscapePhaseTrigger;
        GameplayEvents.OnLocalPlayerRequestEscape += HandleLocalPlayerEscapeRequest;

        // [FIX CHÍ MẠNG]: Dạy GameManager lắng nghe trạng thái sống/chết của Player
        GameplayEvents.OnPlayerStatusChanged += HandleLocalPlayerStatusChanged;
    }

    public override void OnDisable()
    {
        base.OnDisable();
        GameplayEvents.OnAltarActivated -= HandleEscapePhaseTrigger;
        GameplayEvents.OnLocalPlayerRequestEscape -= HandleLocalPlayerEscapeRequest;
        GameplayEvents.OnPlayerStatusChanged -= HandleLocalPlayerStatusChanged;
    }

    private void HandleLocalPlayerStatusChanged(int actorNum, PlayerMatchStatus newStatus)
    {
        // Khi thuyền hú "Thằng này bị bỏ lại (Eliminated)", Client tự giác báo lên Master
        if (PhotonNetwork.LocalPlayer.ActorNumber == actorNum)
        {
            ReportStatusChange(actorNum, newStatus);
        }
    }

    // --- NETWORK STATE SYNCHRONIZATION ---

    // Callback từ Photon: Khi Room Properties thay đổi (Do Master update state)
    public override void OnRoomPropertiesUpdate(ExitGames.Client.Photon.Hashtable propertiesThatChanged)
    {
        if (!_isLocalDataReady) return;

        if (propertiesThatChanged.ContainsKey(KEY_GAME_STATE))
        {
            // Ép kiểu int về Enum
            GameState newState = (GameState)(int)propertiesThatChanged[KEY_GAME_STATE];
            SetLocalState(newState);
        }
    }

    // Chỉ Master mới được gọi hàm này để ra lệnh đổi State toàn server
    private void UpdateNetworkState(GameState newState)
    {
        if (!PhotonNetwork.IsMasterClient) return;

        ExitGames.Client.Photon.Hashtable props = new ExitGames.Client.Photon.Hashtable { { KEY_GAME_STATE, (int)newState } };
        PhotonNetwork.CurrentRoom.SetCustomProperties(props);
    }

    // Hàm xử lý Logic cục bộ khi State thay đổi
    [System.Obsolete]
    private void SetLocalState(GameState newState)
    {
        if (CurrentState == newState) return;
        CurrentState = newState;
        Debug.Log($"<color=yellow>[GameManager]</color> Chuyển State: {newState}");
        GameplayEvents.OnGameStateChanged?.Invoke(newState);

        switch (newState)
        {
            case GameState.WaitingForPlayers: Debug.Log("[GameManager] Đang chờ người chơi..."); break;
            case GameState.Playing:
                Debug.Log("[GameManager] START GAME!");
                // var globalUI = FindObjectOfType<GlobalUIManager>();
                // if (globalUI != null)
                // {
                //     globalUI.ShowLoading(false);
                // }
                break;
            case GameState.EscapePhase: Debug.Log("[GameManager] RUN NOW!"); break;
            case GameState.Ending:

                Debug.Log("[GameManager] MATCH ENDED.");

                if (PhotonNetwork.IsMasterClient)
                {
                    // 1. Tạo Data Match History
                    var dto = CreateMatchResultData();

                    // 2. Gửi API lưu Lịch sử (Chỉ Master gửi)
                    _matchDataService.ReportMatchResultAsync(dto).Forget();

                    // 3. Bắn RPC hiện UI cho tất cả mọi người
                    string jsonDTO = JsonUtility.ToJson(dto);
                    photonView.RPC(nameof(RpcShowGameResult), RpcTarget.All, jsonDTO);
                }

                // AI CŨNG PHẢI TỰ GỬI TIẾN ĐỘ NHIỆM VỤ CỦA MÌNH LÊN SERVER
                SendQuestProgressAPIAsync().Forget();

                break;
        }
    }

    // Test stuffs ======================

    // Hàm đóng gói số liệu và gọi Service gửi lên Backend
    private async UniTaskVoid SendQuestProgressAPIAsync()
    {
        if (_statisticManager == null || _profileService == null || _session == null) return;

        // Xử lý xác định Win hay Lose của máy cục bộ
        int myActorNum = PhotonNetwork.LocalPlayer.ActorNumber;
        PlayerMatchStatus myStatus = _playerStatuses.ContainsKey(myActorNum) ? _playerStatuses[myActorNum] : PlayerMatchStatus.Eliminated;
        bool isWin = myStatus == PlayerMatchStatus.Escaped;

        // Rút Raw Data JSON từ Statistic Manager
        string questPayloadJson = _statisticManager.GetRawStatsPayloadForQuestAPI(isWin);
        Debug.Log($"[GameManager] Dang gui Quest Payload: {questPayloadJson}");

        // Gọi qua lớp Service chuẩn SOLID
        bool success = await _profileService.UpdateQuestProgressAsync(questPayloadJson, _session.Token);

        if (success)
        {
            Debug.Log("[GameManager] Cap nhat tien do Quest thanh cong!");
        }
        else
        {
            Debug.LogError("[GameManager] Loi khi cap nhat tien do Quest!");
        }
    }

    [PunRPC]
    private void RpcShowGameResult(string jsonDTO)
    {
        StartCoroutine(EndGameSequence(jsonDTO));
    }

    private IEnumerator EndGameSequence(string jsonDTO)
    {
        Debug.Log("🏁 Client: Nhận lệnh End Game -> Hiện UI!");

        // Parse Data
        var matchData = JsonUtility.FromJson<SaveMatchRequestDTO>(jsonDTO);

        if (_uiManager == null)
        {
            _uiManager = Object.FindFirstObjectByType<GameplayUIManager>(FindObjectsInactive.Include);
        }

        // HIỆN UI KẾT QUẢ
        if (_uiManager != null)
        {
            _uiManager.ShowGameResult(matchData);
        }
        else
        {
            Debug.LogError(" [CRITICAL] GameplayUIManager không hề tồn tại trong Scene! Không thể bung bảng Result!");
        }
        yield return null;
    }

    private SaveMatchRequestDTO CreateMatchResultData()
    {
        // 1. CHỐT SỔ! Tính toán Title cho tất cả mọi người
        if (_statisticManager != null)
        {
            _statisticManager.CalculateFinalTitles();
        }
        else
        {
            Debug.LogError(" MatchStatisticManager chưa được Inject!");
        }

        var endTime = System.DateTime.UtcNow;
        // Nếu _matchStartTime chưa được set (do lỗi gì đó), thì mặc định lấy endTime trừ 1 phút cho an toàn, đỡ bị âm
        if (_matchStartTime == default)
            _matchStartTime = endTime.AddMinutes(-1);

        // Tính khoảng thời gian bằng giây (luôn ra số dương)
        int calculatedDuration = (int)(endTime - _matchStartTime).TotalSeconds;
        calculatedDuration = Mathf.Max(0, calculatedDuration); // Đảm bảo không bao giờ âm

        string startStr = _matchStartTime.ToString("o"); // Format ISO 8601
        string endStr = endTime.ToString("o");

        var dto = new SaveMatchRequestDTO
        {
            mapId = _mapData.CurrentMapConfig != null ? _mapData.CurrentMapConfig.identityConfig.mapId : "MAP_01_ONG_KE",
            sessionId = PhotonNetwork.CurrentRoom != null ? PhotonNetwork.CurrentRoom.Name : "Room_Mock_" + Random.Range(100, 999),
            startTime = startStr,
            endTime = endStr,
            durationSec = calculatedDuration,
            moonEventId = _moonManager?.CurrentMoon?.eventId ?? "EVENT_MOON_DEFAULT",
            moonEventName = _moonManager?.CurrentMoon?.eventName ?? "Trăng Mặc Định",
            playerResults = new List<PlayerResultRequestDTO>()
        };

        foreach (var p in PhotonNetwork.PlayerList)
        {
            // Lấy status từ list lưu ở Master
            PlayerMatchStatus status = _playerStatuses.ContainsKey(p.ActorNumber) ? _playerStatuses[p.ActorNumber] : PlayerMatchStatus.Eliminated;
            bool isWin = status == PlayerMatchStatus.Escaped; // Cập nhật logic thắng tùy theo yêu cầu của bạn
            string outcome = isWin ? "ESCAPED" : "DEAD";

            string mockMongoID = "659d4b1e9d3e2a1b3c4d5e6f"; // [TODO] Đổi ID thật
            if (p.CustomProperties.ContainsKey("UserId"))
                mockMongoID = (string)p.CustomProperties["UserId"];

            // 2. GỌI STATISTIC MANAGER ĐỂ LẤY KẾT QUẢ ĐÃ TÍNH TOÁN
            if (_statisticManager != null)
            {
                var playerResult = _statisticManager.GetFinalResultForPlayer(p, mockMongoID, isWin, outcome, _currentMatchRoute);
                dto.playerResults.Add(playerResult);
            }
        }
        return dto;
    }

    // --- [NEW] LOGIC GỬI MOCK DATA VỀ SERVER ---
    // --- [NEW] LOGIC GỬI MOCK DATA VỀ SERVER ---
    private async UniTaskVoid SendMockMatchReport()
    {
        var endTime = System.DateTime.UtcNow;
        var duration = (int)(endTime - _matchStartTime).TotalSeconds;
        if (duration < 10) duration = 600;

        // 1. Tạo DTO Request cho Match
        var matchRequest = new SaveMatchRequestDTO
        {
            mapId = _mapData.CurrentMapConfig != null ? _mapData.CurrentMapConfig.identityConfig.mapId : "MAP_MOCK_TEST",
            sessionId = PhotonNetwork.CurrentRoom != null ? PhotonNetwork.CurrentRoom.Name : "Room_Offline_Test",
            startTime = _matchStartTime.ToString("o"),
            endTime = endTime.ToString("o"),
            durationSec = duration,
            playerResults = new List<PlayerResultRequestDTO>()
        };

        foreach (var p in PhotonNetwork.PlayerList)
        {
            PlayerMatchStatus status = _playerStatuses.ContainsKey(p.ActorNumber)
                ? _playerStatuses[p.ActorNumber]
                : PlayerMatchStatus.Playing;

            bool isPlayerWin = status == PlayerMatchStatus.Escaped;
            string mockUserId = p.IsLocal ? "659d4b1e9d3e2a1b3c4d5e6f" : "696da0d5a6e42a937b80aaff";

            var playerResult = new PlayerResultRequestDTO
            {
                userId = mockUserId,
                nickname = p.NickName,
                isWin = isPlayerWin,
                outcome = isPlayerWin ? "ESCAPED" : "DEAD",
                rewards = new MatchRewardDTO
                {
                    exp = isPlayerWin ? 1000 : 100,
                    coin = isPlayerWin ? 500 : 50
                },
                titles = new List<string> { "Tester", "BugHunter" }
            };

            matchRequest.playerResults.Add(playerResult);
        }

        // ===============================================
        // 2. CHUẨN BỊ RAW STATS CHO QUEST API
        // ===============================================
        PlayerMatchStatus myStatus = _playerStatuses.ContainsKey(PhotonNetwork.LocalPlayer.ActorNumber)
                ? _playerStatuses[PhotonNetwork.LocalPlayer.ActorNumber]
                : PlayerMatchStatus.Playing;
        bool isWin = myStatus == PlayerMatchStatus.Escaped;

        string questPayloadJson = "";
        if (_statisticManager != null)
        {
            // Lấy JSON string trực tiếp từ hàm chuẩn hóa
            questPayloadJson = _statisticManager.GetRawStatsPayloadForQuestAPI(isWin);
            Debug.Log($"<color=yellow>[GameManager] Đóng gói Quest Payload: {questPayloadJson}</color>");
        }

        // ===============================================
        // 3. BẮN 2 SÚNG SONG SONG (BỎ DÒNG ĐỢI AWAIT CŨ)
        // ===============================================
        Debug.Log("<color=orange>[GameManager] Đang gửi kết quả Match & Quest lên Server...</color>");

        // Task 1: Gửi Match History (Giữ dùng Service của sếp)
        var matchTask = _matchDataService.ReportMatchResultAsync(matchRequest);

        // Task 2: Gửi Quest Stats (Chọc thẳng APIClient hoặc tạo QuestDataService tuỳ sếp)
        // Ở đây tui ví dụ gọi qua APIClient (nhớ Inject APIClient vào GameManager nếu chưa có)
        // var questTask = _apiClient.PostAsyncWithAuth<object>("/api/quests/update-progress", questPayloadJson, _session.Token);

        // Chờ cả 2 xong
        // await UniTask.WhenAll(matchTask, questTask);

        // NẾU SẾP CHƯA TẠO API CHO QUEST THÌ CỨ ĐỂ MỘT MÌNH MATCH TASK CHẠY TRƯỚC:
        await matchTask;

        Debug.Log("<color=green>[GameManager] Xong! Đã gửi toàn bộ thông tin lên Server!</color>");
    }

    // --- GAMEPLAY LOGIC FLOW ---

    private void CheckReadyToSpawn()
    {
        // 1. Spawn Player của bản thân (Ai cũng phải tự spawn mình)
        if (_playerSpawner != null)
        {
            _playerSpawner.SpawnLocalPlayer(_mapData);
        }
        else
        {
            Debug.LogError(" [GameManager] PlayerSpawner chưa được Inject!");
        }

        // 2. Nếu là Master, sau khi spawn xong thì chuyển game sang Playing
        if (PhotonNetwork.IsMasterClient)
        {
            // Có thể thêm logic: Đợi đủ 4 người mới Start, hoặc đếm ngược 3s
            // Ở đây ta start luôn cho nhanh gọn
            UpdateNetworkState(GameState.Playing);
        }
    }

    // Sự kiện: Khi ObjectiveManager báo đã xong hết nhiệm vụ
    private void HandleEscapePhaseTrigger()
    {
        // Chỉ Master mới có quyền chuyển Phase để tránh xung đột
        if (PhotonNetwork.IsMasterClient)
        {
            Debug.Log("[GameManager] Master xác nhận: Chuyển sang Escape Phase.");
            UpdateNetworkState(GameState.EscapePhase);
        }
    }

    private void HandleLocalPlayerEscapeRequest()
    {
        // Chỉ được thoát khi Cổng đã mở (Escape Phase)
        if (CurrentState != GameState.EscapePhase)
        {
            Debug.LogWarning("[GameManager] Cổng chưa mở, không thể thoát!");
            return;
        }

        Debug.Log("[GameManager] Gửi yêu cầu thoát lên Server...");
        // Gọi RPC báo cho Master biết mình đã thoát
        photonView.RPC(nameof(UpdatePlayerStatusRPC), RpcTarget.MasterClient,
            PhotonNetwork.LocalPlayer.ActorNumber, (int)PlayerMatchStatus.Escaped);
    }

    // --- NETWORK LOGIC (MASTER ONLY) ---

    public void ReportStatusChange(int actorNumber, PlayerMatchStatus status)
    {
        // [FIX BOMB]: Tránh việc gọi gửi Report khi game đã End (Gây spam mạng)
        if (CurrentState == GameState.Ending) return;

        photonView.RPC(nameof(UpdatePlayerStatusRPC), RpcTarget.MasterClient, actorNumber, (int)status);
    }

    [PunRPC]
    private void UpdatePlayerStatusRPC(int actorNumber, int statusInt)
    {
        // Chỉ Master mới có quyền phán xét trạng thái
        if (!PhotonNetwork.IsMasterClient) return;

        PlayerMatchStatus newStatus = (PlayerMatchStatus)statusInt;

        if (!_playerStatuses.ContainsKey(actorNumber))
        {
            _playerStatuses[actorNumber] = PlayerMatchStatus.Playing;
        }

        var currentStatus = _playerStatuses[actorNumber];

        // [FIX BOMB 1]: NẾU TRẠNG THÁI GIỐNG NHAU THÌ DỪNG LẠI NGAY! (Chống lặp vô tận)
        if (currentStatus == newStatus) return;

        // Validate logic (ví dụ: Đã chết thì không thể thoát)
        if (currentStatus == PlayerMatchStatus.Eliminated || currentStatus == PlayerMatchStatus.Escaped)
        {
            return; // Đã xong rồi thì thôi
        }

        // Cập nhật Server Data
        _playerStatuses[actorNumber] = newStatus;
        Debug.Log($"[GameManager] Player {actorNumber} -> {newStatus}");

        // Đồng bộ lại cho tất cả client biết để cập nhật UI/Spectator
        photonView.RPC(nameof(SyncPlayerStatusRPC), RpcTarget.All, actorNumber, statusInt);
    }

    [PunRPC]
    private void SyncPlayerStatusRPC(int actorNumber, int statusInt)
    {
        PlayerMatchStatus status = (PlayerMatchStatus)statusInt;

        // Bắn event để UI Manager cập nhật (Gạch tên, đổi màu...)
        GameplayEvents.OnPlayerStatusChanged?.Invoke(actorNumber, status);

        // Xử lý logic cá nhân (nếu là mình)
        if (PhotonNetwork.LocalPlayer.ActorNumber == actorNumber)
        {
            if (status == PlayerMatchStatus.Escaped)
            {
                Debug.Log("<color=green>BẠN ĐÃ THOÁT! CHUYỂN SPECTATOR.</color>");
            }
            else if (status == PlayerMatchStatus.Eliminated)
            {
                Debug.Log("<color=red>BẠN ĐÃ BỊ LOẠI! CHUYỂN SPECTATOR.</color>");
            }
        }

        // [FIX BOMB 2]: CHỈ MASTER MỚI ĐƯỢC QUYỀN KIỂM TRA ĐIỀU KIỆN END GAME
        // Khúc này trước đây sếp để ở ngoài, ai cũng chạy, đâm ra loạn cào cào mạng!
        if (PhotonNetwork.IsMasterClient)
        {
            CheckEndGameCondition();
        }
    }

    private void CheckEndGameCondition()
    {
        // Chắc ăn thêm phát nữa, chỉ Master mới có quyền phán xét kết thúc game
        if (!PhotonNetwork.IsMasterClient || CurrentState == GameState.Ending) return;

        int activePlayers = 0;
        bool teamHasEscaped = false;

        foreach (var status in _playerStatuses.Values)
        {
            // Nếu còn người Đang chơi hoặc Bị nock (còn cứu được) -> Game chưa hết
            if (status == PlayerMatchStatus.Playing)
            {
                activePlayers++;
            }

            // Nếu có ít nhất 1 người thoát thành công
            if (status == PlayerMatchStatus.Escaped)
            {
                teamHasEscaped = true;
            }
        }

        Debug.Log($"[GameManager] Active Players: {activePlayers}");

        if (activePlayers == 0)
        {
            Debug.Log(">>> ALL PLAYERS DONE. END GAME. <<<");

            if (teamHasEscaped) _currentMatchRoute = MatchRoute.Escape;
            else _currentMatchRoute = MatchRoute.Lose;

            UpdateNetworkState(GameState.Ending);
        }
    }

    // Sự kiện: Khi Player chạy vào vùng Exit (Được gọi từ Script Trigger ở cổng)
    public void OnPlayerReachedExit(int actorNumber)
    {
        Debug.Log($"[GameManager] Player {actorNumber} đã thoát!");

        if (PhotonNetwork.IsMasterClient)
        {
            // Demo: Cứ có người thoát là End Game luôn (hoặc sửa logic tùy game design)
            // UpdateNetworkState(GameState.Ending);
        }
    }

    // Lưới bảo hộ: Hàm thoát khẩn cấp khi gặp lỗi kẹt game
    public void EmergencyExit()
    {
        Debug.LogError("!!! EMERGENCY EXIT !!!");
        PhotonNetwork.LeaveRoom();
        // SceneLoader.LoadScene("MainMenu"); // Gọi SceneLoader để về menu
    }
}