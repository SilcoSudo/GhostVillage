using System.Collections.Generic;
using ExitGames.Client.Photon;
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

// Lưu ý: Đảm bảo bạn đã có các Enum và file GameplayEvents.cs như đã bàn trước đó
public class GameManager : MonoBehaviourPunCallbacks
{
    // --- STATE MACHINE ---
    public GameState CurrentState { get; private set; } = GameState.Initializing;
    private const string KEY_GAME_STATE = "G_State";

    private Dictionary<int, PlayerMatchStatus> _playerStatuses = new Dictionary<int, PlayerMatchStatus>();
    private System.DateTime _matchStartTime; // Biến lưu giờ bắt đầu

    // --- DEPENDENCY INJECTION (VContainer) ---
    private MapDataManager _mapData;
    private ItemSpawnerManager _itemSpawner;
    private MonsterSpawnerManager _monsterSpawner;
    private PuzzleSpawnerManager _puzzleSpawner;
    private PlayerSpawner _playerSpawner;
    private ObjectiveManager _objectiveManager;
    private MatchDataService _matchDataService;
    private GameplayUIManager _uiManager;

    // VContainer sẽ tự động điền các biến này vào khi Prefab GameContext được khởi tạo
    [Inject]
    public void Construct(
        MapDataManager mapData,
        ItemSpawnerManager itemSpawner,
        MonsterSpawnerManager monsterSpawner,
        PuzzleSpawnerManager puzzleSpawner,
        PlayerSpawner playerSpawner,
        ObjectiveManager objectiveManager,
        MatchDataService matchDataService,
        GameplayUIManager uiManager
    )
    {
        _mapData = mapData;
        _itemSpawner = itemSpawner;
        _monsterSpawner = monsterSpawner;
        _puzzleSpawner = puzzleSpawner;
        _playerSpawner = playerSpawner;
        _objectiveManager = objectiveManager;
        _matchDataService = matchDataService;
        _uiManager = uiManager;
    }

    // --- UNITY LIFECYCLE ---

    private void Start()
    {
        Debug.Log("<color=cyan>[GameManager]</color> Khởi động vòng lặp Game...");

        // 1. Initializing (Chạy cục bộ trên mỗi máy)
        SetLocalState(GameState.Initializing);

        MapConfigDTO configToLoad = null;

        // 1. Ưu tiên lấy từ Lobby (GameDataTransfer)
        if (GameDataTransfer.Instance != null)
        {
            configToLoad = GameDataTransfer.Instance.SelectedMapConfig;
        }
        else
        {
            // 2. Fallback: Nếu debug trực tiếp scene này, tạo Mock Data hoặc Load Default
            Debug.LogWarning("⚠️ Không tìm thấy GameDataTransfer (Chạy trực tiếp?). Dùng Config Mặc định/Mock.");
            // configToLoad = LoadDefaultConfig(); // Tự viết hàm này nếu cần test nhanh
        }

        // --- GỌI MAP DATA (TRUYỀN THAM SỐ) ---
        if (_mapData != null)
        {
            _mapData.InitializeMap(configToLoad);
        }
        else
        {
            Debug.LogError("❌ [GameManager] MapData chưa được Inject!");
        }
        // 2. Spawn World (Chỉ Master Client thực hiện để tránh trùng lặp)
        if (PhotonNetwork.IsMasterClient)
        {
            _matchStartTime = System.DateTime.UtcNow;

            foreach (var p in PhotonNetwork.PlayerList)
            {
                _playerStatuses[p.ActorNumber] = PlayerMatchStatus.Playing;
            }

            var config = _mapData.CurrentMapConfig;
            if (config != null)
            {
                Debug.Log("[GameManager] Config found. Spawning systems..."); // Thêm dòng này
                if (_itemSpawner != null) _itemSpawner.SpawnItems(config.consumableConfig, _mapData);
                else Debug.LogError("[GameManager] ItemSpawner is NULL!");

                _monsterSpawner.SpawnMonsters(config.monsterSystemConfig, _mapData);
                _puzzleSpawner.SpawnPuzzles(config.puzzleConfig, _mapData);
                _objectiveManager.Initialize();
            }
            else Debug.LogError("[GameManager] Config is NULL!");

            // Master chuyển trạng thái sang Chờ Người Chơi
            UpdateNetworkState(GameState.WaitingForPlayers);
        }
        else
        {
            Debug.Log("<color=blue>[GameManager]</color> Tôi là Client thường, chờ Master điều phối...");
            // Client con: Nếu vào sau, tự động đồng bộ State từ Server về
            if (PhotonNetwork.CurrentRoom.CustomProperties.ContainsKey(KEY_GAME_STATE))
            {
                GameState serverState = (GameState)(int)PhotonNetwork.CurrentRoom.CustomProperties[KEY_GAME_STATE];
                SetLocalState(serverState);
            }
        }

        // Lắng nghe sự kiện "Hoàn thành tất cả nhiệm vụ" để chuyển pha Chạy Trốn
        GameplayEvents.OnAltarActivated += HandleEscapePhaseTrigger;
        GameplayEvents.OnLocalPlayerRequestEscape += HandleLocalPlayerEscapeRequest;
    }

    public override void OnDisable()
    {
        base.OnDisable();
        GameplayEvents.OnAltarActivated -= HandleEscapePhaseTrigger;
    }

    // --- NETWORK STATE SYNCHRONIZATION ---

    // Callback từ Photon: Khi Room Properties thay đổi (Do Master update state)
    public override void OnRoomPropertiesUpdate(ExitGames.Client.Photon.Hashtable propertiesThatChanged)
    {
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
    private void SetLocalState(GameState newState)
    {
        if (CurrentState == newState) return;
        CurrentState = newState;
        Debug.Log($"<color=yellow>[GameManager]</color> Chuyển State: {newState}");
        GameplayEvents.OnGameStateChanged?.Invoke(newState);

        switch (newState)
        {
            case GameState.WaitingForPlayers: CheckReadyToSpawn(); break;
            case GameState.Playing: Debug.Log("[GameManager] START GAME!"); break;
            case GameState.EscapePhase: Debug.Log("[GameManager] RUN NOW!"); break;

            case GameState.Ending:
                Debug.Log("[GameManager] MATCH ENDED.");

                Debug.Log("[GameManager] MATCH ENDED.");

                if (PhotonNetwork.IsMasterClient)
                {
                    // 1. Tạo Data (Mock hoặc thật)
                    var dto = CreateMatchResultData();

                    // 2. Gửi API lưu DB (Fire & Forget)
                    _matchDataService.ReportMatchResultAsync(dto).Forget();

                    // 3. Bắn RPC hiện UI cho tất cả mọi người
                    string jsonDTO = JsonUtility.ToJson(dto);
                    photonView.RPC(nameof(RpcShowGameResult), RpcTarget.All, jsonDTO);
                }
                break;
        }
    }

    // Test stuffs ======================

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

        // TODO: Chỗ này sau này thêm logic reset Voice về Global (Gọi vào VoiceManager)

        // HIỆN UI KẾT QUẢ
        if (_uiManager != null)
        {
            _uiManager.ShowGameResult(matchData);
        }
        else
        {
            Debug.LogError("❌ GameplayUIManager chưa được Inject vào GameManager!");
        }
        yield return null;
    }

    // Hàm tạo Mock Data nhanh để test
    // Trong GameManager.cs

    private SaveMatchRequestDTO CreateMatchResultData()
    {
        var endTime = System.DateTime.UtcNow;
        // Fix: Đảm bảo thời gian có giá trị
        string startStr = _matchStartTime == default ? endTime.AddMinutes(-10).ToString("o") : _matchStartTime.ToString("o");
        string endStr = endTime.ToString("o");

        var dto = new SaveMatchRequestDTO
        {
            // Fix: Map ID phải khớp Config DB
            mapId = _mapData.CurrentMapConfig != null ? _mapData.CurrentMapConfig.identityConfig.mapId : "MAP_01_ONG_KE",
            // Fix: Session ID không được rỗng
            sessionId = PhotonNetwork.CurrentRoom != null ? PhotonNetwork.CurrentRoom.Name : "Room_Mock_" + Random.Range(100, 999),
            startTime = startStr,
            endTime = endStr,
            durationSec = (int)(endTime - (System.DateTime.Parse(startStr))).TotalSeconds,
            playerResults = new List<PlayerResultRequestDTO>()
        };

        foreach (var p in PhotonNetwork.PlayerList)
        {
            bool isMe = p.IsLocal;

            // [FIX QUAN TRỌNG] Mock ID phải chuẩn format MongoDB (24 ký tự hex)
            // Nếu ID thật chưa có, dùng ID fake chuẩn format này:
            string mockMongoID = "659d4b1e9d3e2a1b3c4d5e6f"; // ID Hùng (hoặc random ra)

            // Logic lấy ID thật nếu có
            if (p.CustomProperties.ContainsKey("UserId"))
                mockMongoID = (string)p.CustomProperties["UserId"];

            dto.playerResults.Add(new PlayerResultRequestDTO
            {
                userId = mockMongoID,
                nickname = p.NickName,
                outcome = isMe ? "ESCAPED" : "DEAD",
                isWin = isMe,
                rewards = new MatchRewardDTO { exp = 1000, coin = 500 },
                titles = new List<string>()
            });
        }
        return dto;
    }

    // end Test stuffs ======================

    // --- [NEW] LOGIC GỬI MOCK DATA VỀ SERVER ---
    private async UniTaskVoid SendMockMatchReport()
    {
        var endTime = System.DateTime.UtcNow;
        var duration = (int)(endTime - _matchStartTime).TotalSeconds;
        // Fix cứng duration nếu test quá nhanh
        if (duration < 10) duration = 600;

        // 1. Tạo DTO Request
        var request = new SaveMatchRequestDTO
        {
            mapId = _mapData.CurrentMapConfig != null ? _mapData.CurrentMapConfig.identityConfig.mapId : "MAP_MOCK_TEST",
            sessionId = PhotonNetwork.CurrentRoom != null ? PhotonNetwork.CurrentRoom.Name : "Room_Offline_Test",
            startTime = _matchStartTime.ToString("o"), // ISO format
            endTime = endTime.ToString("o"),
            durationSec = duration,
            playerResults = new List<PlayerResultRequestDTO>()
        };

        // 2. Loop qua danh sách người chơi để tạo Mock Result cho từng người
        foreach (var p in PhotonNetwork.PlayerList)
        {
            // Lấy status hiện tại
            PlayerMatchStatus status = _playerStatuses.ContainsKey(p.ActorNumber)
                ? _playerStatuses[p.ActorNumber]
                : PlayerMatchStatus.Playing;

            // Mock Logic: Nếu Escaped thì Win, còn lại là Thua
            bool isWin = status == PlayerMatchStatus.Escaped;

            // [MOCK] ID giả lấy từ Seed Data DB (Hùng hoặc Raccoon) để test
            // Logic thật: Lấy từ p.CustomProperties["UserId"]
            string mockUserId = p.IsLocal ? "659d4b1e9d3e2a1b3c4d5e6f" : "696da0d5a6e42a937b80aaff";

            var playerResult = new PlayerResultRequestDTO
            {
                userId = mockUserId,
                nickname = p.NickName,
                isWin = isWin,
                outcome = isWin ? "ESCAPED" : "DEAD", // Mock Outcome
                rewards = new MatchRewardDTO
                {
                    exp = isWin ? 1000 : 100,
                    coin = isWin ? 500 : 50
                },
                titles = new List<string> { "Tester", "BugHunter" } // Mock Titles
            };

            request.playerResults.Add(playerResult);
        }

        // 3. Gửi đi qua Service
        await _matchDataService.ReportMatchResultAsync(request);
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
            Debug.LogError("❌ [GameManager] PlayerSpawner chưa được Inject!");
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

    public void ReportStatusChange(int actorNumber, PlayerMatchStatus status)
    {
        photonView.RPC(nameof(UpdatePlayerStatusRPC), RpcTarget.MasterClient, actorNumber, (int)status);
    }

    // --- NETWORK LOGIC (MASTER ONLY) ---

    [PunRPC]
    private void UpdatePlayerStatusRPC(int actorNumber, int statusInt)
    {
        // Chỉ Master mới có quyền phán xét trạng thái
        if (!PhotonNetwork.IsMasterClient) return;

        PlayerMatchStatus newStatus = (PlayerMatchStatus)statusInt;

        if (_playerStatuses.ContainsKey(actorNumber))
        {
            // Validate logic (ví dụ: Đã chết thì không thể thoát)
            var currentStatus = _playerStatuses[actorNumber];
            if (currentStatus == PlayerMatchStatus.Eliminated || currentStatus == PlayerMatchStatus.Escaped)
            {
                return; // Đã xong rồi thì thôi
            }

            // Cập nhật Server Data
            _playerStatuses[actorNumber] = newStatus;
            Debug.Log($"[GameManager] Player {actorNumber} -> {newStatus}");

            // Đồng bộ lại cho tất cả client biết để cập nhật UI/Spectator
            photonView.RPC(nameof(SyncPlayerStatusRPC), RpcTarget.All, actorNumber, statusInt);

            // Kiểm tra điều kiện kết thúc game
            CheckEndGameCondition();
        }
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
                // Logic ẩn nhân vật, bật camera spectator ở đây
            }
            else if (status == PlayerMatchStatus.Eliminated)
            {
                Debug.Log("<color=red>BẠN ĐÃ BỊ LOẠI! CHUYỂN SPECTATOR.</color>");
            }
        }
    }

    private void CheckEndGameCondition()
    {
        int activePlayers = 0;

        foreach (var status in _playerStatuses.Values)
        {
            // Nếu còn người Đang chơi hoặc Bị nock (còn cứu được) -> Game chưa hết
            if (status == PlayerMatchStatus.Playing || status == PlayerMatchStatus.Knocked)
            {
                activePlayers++;
            }
        }

        Debug.Log($"[GameManager] Active Players: {activePlayers}");

        if (activePlayers == 0)
        {
            Debug.Log(">>> ALL PLAYERS DONE. END GAME. <<<");
            UpdateNetworkState(GameState.Ending);
        }
    }

    // Sự kiện: Khi Player chạy vào vùng Exit (Được gọi từ Script Trigger ở cổng)
    public void OnPlayerReachedExit(int actorNumber)
    {
        Debug.Log($"[GameManager] Player {actorNumber} đã thoát!");

        // Logic kiểm tra điều kiện thắng:
        // Ví dụ: Nếu tất cả người sống sót đã thoát -> Ending
        // Hoặc đơn giản là ai thoát thì tính điểm người đó.

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