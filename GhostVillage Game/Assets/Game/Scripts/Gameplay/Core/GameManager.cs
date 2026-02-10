using System.Collections.Generic;
using ExitGames.Client.Photon;
using Game.Domain.Map.DTOs;
using Game.Scripts.Core.Game;
using Game.Scripts.Gameplay.Core;
using Game.Scripts.View.Lobby.Session;
using Photon.Pun;
using UnityEngine;
using VContainer;

// Lưu ý: Đảm bảo bạn đã có các Enum và file GameplayEvents.cs như đã bàn trước đó
public class GameManager : MonoBehaviourPunCallbacks
{
    // --- STATE MACHINE ---
    public GameState CurrentState { get; private set; } = GameState.Initializing;
    private const string KEY_GAME_STATE = "G_State";

    private Dictionary<int, PlayerMatchStatus> _playerStatuses = new Dictionary<int, PlayerMatchStatus>();

    // --- DEPENDENCY INJECTION (VContainer) ---
    private MapDataManager _mapData;
    private ItemSpawnerManager _itemSpawner;
    private MonsterSpawnerManager _monsterSpawner;
    private PuzzleSpawnerManager _puzzleSpawner;
    private PlayerSpawner _playerSpawner;
    private ObjectiveManager _objectiveManager;

    // VContainer sẽ tự động điền các biến này vào khi Prefab GameContext được khởi tạo
    [Inject]
    public void Construct(
        MapDataManager mapData,
        ItemSpawnerManager itemSpawner,
        MonsterSpawnerManager monsterSpawner,
        PuzzleSpawnerManager puzzleSpawner,
        PlayerSpawner playerSpawner,
        ObjectiveManager objectiveManager
    )
    {
        _mapData = mapData;
        _itemSpawner = itemSpawner;
        _monsterSpawner = monsterSpawner;
        _puzzleSpawner = puzzleSpawner;
        _playerSpawner = playerSpawner;
        _objectiveManager = objectiveManager;
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
            Debug.Log("<color=green>[GameManager]</color> Tôi là Master, chuẩn bị spawn hệ thống...");
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
    public override void OnRoomPropertiesUpdate(Hashtable propertiesThatChanged)
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

        Hashtable props = new Hashtable { { KEY_GAME_STATE, (int)newState } };
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
                // Bắn event kèm kết quả để UI hiển thị bảng tổng sắp
                GameplayEvents.OnGameMatchEnded?.Invoke(_playerStatuses);
                break;
        }
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