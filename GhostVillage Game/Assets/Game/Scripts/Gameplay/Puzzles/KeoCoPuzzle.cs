using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;
using Photon.Pun;
using GhostVillage.Gameplay.Monsters.VongNhi;
using Game.Scripts.Gameplay.Core;
using Game.Core.Player.RayCast;

/// Inspector Setup:
///   1. Gắn script này vào object Cột/Dây kéo co (cần Collider + PhotonView)
///   2. Tạo Canvas UI (Screen Space Overlay) và assign vào keoCoCanvas
///   3. Tạo Slider trong Canvas (range 0-1, start 0.5) assign vào ropeSlider
///   4. Assign TextMeshProUGUI cho statusText và timerText
///   5. Assign OngKeMonster reference vào ongKe
///   6. Set layer object này = "Interactable"
/// </summary>
public class KeoCoPuzzle : MonoBehaviourPun, IPuzzleInteractTarget
{
    [Header("--- Phần Thưởng ---")]
    [Tooltip("Key Item trao khi thắng (kéo KeyItemSO vào đây)")]
    public KeyItemSO keyItemReward;

    // ─── UI ───────────────────────────────────────────────────
    [Header("--- UI ---")]
    [Tooltip("Canvas kéo co (Screen Space Overlay). Bắt đầu tắt)")]
    [SerializeField] private Canvas keoCoCanvas;
    [Tooltip("Slider thể hiện thế kéo dây tổng quát: 0=Vòng Nhi, 1=Player")]
    [SerializeField] private Slider ropeSlider;
    [Tooltip("Dòng chữ hiển thị chuỗi mũi tên cần bấm và tiến độ hiện tại")]
    [SerializeField] private TextMeshProUGUI statusText;
    [Tooltip("Đồng hồ đếm ngược còn lại của cả chuỗi")]
    [SerializeField] private TextMeshProUGUI timerText;
    [Tooltip("Panel kết quả (Thắng/Thua), tắt khi bắt đầu)")]
    [SerializeField] private GameObject resultPanel;
    [Tooltip("Text trong result panel")]
    [SerializeField] private TextMeshProUGUI resultText;
    [Tooltip("Hiển thị UI kéo co bằng overlay code (không phụ thuộc Canvas setup)")]
    [SerializeField] private bool useRuntimeOverlayUI = true;

    // ─── Vòng Nhi ─────────────────────────────────────────────
    [Header("--- Vòng Nhi ---")]
    [Tooltip("VongNhiMonster trong scene – đối thủ trong kéo co")]
    [SerializeField] private VongNhiMonster vongNhi;
    [Tooltip("Tự tìm Vòng Nhi trong scene nếu chưa gán reference")]
    [SerializeField] private bool autoFindVongNhiIfMissing = true;
    [Tooltip("Tag dùng để tìm Vòng Nhi (optional)")]
    [SerializeField] private string vongNhiTag = "VongNhi";

    [Header("--- Vị Trí Kéo Dây ---")]
    [Tooltip("Điểm đứng của player khi bắt đầu kéo co (optional)")]
    [SerializeField] private Transform playerPullPoint;
    [Tooltip("Điểm đứng của Vòng Nhi khi bắt đầu kéo co (optional)")]
    [SerializeField] private Transform vongNhiPullPoint;

    [Header("--- Mốc Dây & Vạch Thắng (World) ---")]
    [Tooltip("Mốc giữa dây trong scene (object sẽ dịch chuyển theo lực kéo)")]
    [SerializeField] private Transform ropeCenterMarker;
    [Tooltip("Điểm biên trái của quãng di chuyển mốc dây")]
    [SerializeField] private Transform markerLeftLimit;
    [Tooltip("Điểm biên phải của quãng di chuyển mốc dây")]
    [SerializeField] private Transform markerRightLimit;
    [Tooltip("Vạch thắng của Vòng Nhi trên mặt đất (optional)")]
    [SerializeField] private Transform vongNhiGroundLine;
    [Tooltip("Vạch thắng của người chơi trên mặt đất (optional)")]
    [SerializeField] private Transform playerGroundLine;

    [Header("--- Player Control ---")]
    [Tooltip("Khóa điều khiển player trong lúc kéo co")]
    [SerializeField] private bool lockPlayerDuringMinigame = true;
    [Tooltip("Cho phép hủy kéo co bằng phím F hoặc Esc")]
    [SerializeField] private bool allowCancelWithFOrEsc = true;
    [Tooltip("Khóa input hủy trong vài mili giây đầu để tránh ăn lại phím F vừa bấm")]
    [SerializeField] private float cancelInputDelay = 0.2f;

    // ─── Balance ──────────────────────────────────────────────
    [Header("--- Balance ---")]
    [Tooltip("Số phím mũi tên phải bấm đúng trong một lần kéo co")]
    [SerializeField] private int sequenceLength = 5;
    [Tooltip("Thời gian tối đa của một trận kéo co (giây)")]
    [SerializeField] private float matchDuration = 30f;
    [Tooltip("Lực kéo thụ động của Vòng Nhi mỗi giây (kéo mốc về phía 0)")]
    [SerializeField] private float vongNhiPullPerSecond = 0.08f;
    [Tooltip("Lực kéo khi người chơi bấm đúng phím")]
    [SerializeField] private float playerPullPerCorrect = 0.09f;
    [Tooltip("Mức hụt khi người chơi bấm sai phím")]
    [SerializeField] private float playerPenaltyOnWrong = 0.06f;
    [Tooltip("Vị trí vạch thắng của người chơi trên slider (0-1)")]
    [SerializeField] private float playerWinLine = 0.82f;
    [Tooltip("Vị trí vạch thắng của Vòng Nhi trên slider (0-1)")]
    [SerializeField] private float vongNhiWinLine = 0.18f;
    [Tooltip("Thời gian hiển thị màn hình kết quả trước khi đóng UI (giây)")]
    [SerializeField] private float resultDisplayTime = 2f;

    // ─── Runtime ──────────────────────────────────────────────
    private bool _isSolved = false;          // puzzle đã bị ai đó giải (sau khi thắng)
    private bool _isMinigamePlaying = false; // local: đang trong minigame
    private bool _isAnyonePlaying = false;   // synced: đang có người kéo
    private float _ropeValue = 0.5f;
    private float _sequenceTimer = 0f;
    private float _resultTimer = 0f;
    private float _matchTimer = 0f;
    private bool _showingResult = false;
    private GameObject _localActor = null;   // người chơi local đang kéo
    private FPSController _cachedFpsController = null;
    private PlayerInteract _cachedPlayerInteract = null;
    private bool _controlsLocked = false;
    private float _cancelInputLockTimer = 0f;
    private TugArrow[] _arrowSequence = null;
    private int _currentInputIndex = 0;
    private bool _waitingForArrowInput = false;
    private string _overlayHint = string.Empty;
    private string _overlayResult = string.Empty;

    private enum TugArrow
    {
        Up,
        Down,
        Left,
        Right,
    }

    private void Awake()
    {
        TryResolveVongNhi();
    }

    // ─── Interaction API ──────────────────────────────────────
    public string GetPromptMessage()
    {
        if (_isSolved) return "Đã có người giải";
        if (_isAnyonePlaying) return "Đang có người kéo...";
        return "Kéo co! (F)";
    }

    public void Interact(GameObject actor)
    {
        if (_isSolved || _isAnyonePlaying || _isMinigamePlaying) return;

        PhotonView pv = actor.GetComponent<PhotonView>();
        if (pv == null || !pv.IsMine) return;

        // Báo cho tất cả client là đang bắt đầu (nếu đang online), còn offline thì set local
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(SetPlayingRPC), RpcTarget.All, true);
        else
            SetPlayingRPC(true);

        StartLocalMinigame(actor);
    }

    // ─── Minigame Start ───────────────────────────────────────
    private void StartLocalMinigame(GameObject actor)
    {
        TryResolveVongNhi();
        EnsureUIReady();

        _localActor = actor;
        ResetMatchState();
        _cancelInputLockTimer = cancelInputDelay;
        _overlayHint = "Kéo mốc giữa dây qua vạch bên bạn để thắng!";
        _overlayResult = string.Empty;

        if (keoCoCanvas != null)
        {
            PrepareCanvasForMinigame();
            keoCoCanvas.gameObject.SetActive(true);
            if (resultPanel != null) resultPanel.SetActive(false);
            if (ropeSlider != null) ropeSlider.value = _ropeValue;
            ForceShowUIElement(statusText);
            ForceShowUIElement(timerText);
            ForceShowUIElement(ropeSlider);
            ForceShowUIElement(resultText);
            ForceShowUIElement(resultPanel);
        }

        StartMatch();

        Debug.Log($"[KeoCoP] UI start => Canvas:{keoCoCanvas != null}, Overlay:{useRuntimeOverlayUI}, SeqLen:{sequenceLength}, MatchTime:{_matchTimer:F1}s");

        SnapPlayerToPullPoint(actor);
        LockPlayerControls(actor);

        // Thông báo MasterClient để Vòng Nhi đứng kéo co (online), hoặc gọi local khi offline test
        int actorNum = actor.GetComponent<PhotonView>()?.Owner?.ActorNumber ?? -1;
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(StartKeoCoRPC), RpcTarget.MasterClient, actorNum);
        else
            StartKeoCoRPC(actorNum);

        Debug.Log("[KeoCoP] Bắt đầu kéo co với Vòng Nhi!");
    }

    // ─── Update Loop ──────────────────────────────────────────
    private void Update()
    {
        if (!_isMinigamePlaying && !_showingResult) return;

        if (_cancelInputLockTimer > 0f)
            _cancelInputLockTimer -= Time.deltaTime;

        // Cho phép hủy kéo co bằng F/Esc để thử lại
        if (_isMinigamePlaying && allowCancelWithFOrEsc && _cancelInputLockTimer <= 0f && Keyboard.current != null)
        {
            if (Keyboard.current.fKey.wasPressedThisFrame || Keyboard.current.escapeKey.wasPressedThisFrame)
            {
                CancelMinigame();
                return;
            }
        }

        // Hiển thị kết quả xong → đóng UI
        if (_showingResult)
        {
            _resultTimer -= Time.deltaTime;
            if (_resultTimer <= 0f)
            {
                CloseUI();
            }
            return;
        }

        if (!_waitingForArrowInput)
            return;

        _matchTimer -= Time.deltaTime;
        _ropeValue -= vongNhiPullPerSecond * Time.deltaTime;
        _ropeValue = Mathf.Clamp01(_ropeValue);
        UpdateWorldMarkerVisual();

        if (ropeSlider != null)
            ropeSlider.value = _ropeValue;

        UpdateSliderColor();
        UpdateTimerLabel();

        if (TryCheckWorldLineOutcome(out bool worldPlayerWin, out string worldReason))
        {
            if (worldPlayerWin)
                HandleWin();
            else
                HandleLose(worldReason);
            return;
        }

        if (_ropeValue >= playerWinLine)
        {
            HandleWin();
            return;
        }

        if (_ropeValue <= vongNhiWinLine)
        {
            HandleLose("Mốc giữa dây đã qua vạch của Vòng Nhi.");
            return;
        }

        if (_matchTimer <= 0f)
        {
            HandleLose("Hết thời gian, Vòng Nhi kéo thắng.");
            return;
        }

        _sequenceTimer -= Time.deltaTime;

        if (TryConsumeArrowInput(out TugArrow pressedArrow))
        {
            ResolveInput(pressedArrow);
            return;
        }

        if (_sequenceTimer <= 0f)
        {
            BuildArrowSequence();
            _currentInputIndex = 0;
            _sequenceTimer = Mathf.Max(1.2f, Mathf.Min(3.5f, matchDuration * 0.1f));
            UpdateSequenceStatus("Vòng Nhi kéo mạnh, chuỗi mới!");
        }
    }

    // ─── Win / Lose ───────────────────────────────────────────
    private void HandleWin()
    {
        _isMinigamePlaying = false;
        _waitingForArrowInput = false;
        ShowResult(true, "THẮNG! Bạn đã kéo mốc giữa dây qua vạch của mình.");

        // 1. Khóa puzzle với tất cả client (buffered) nếu online, còn offline thì local
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(DisablePuzzleRPC), RpcTarget.AllBuffered);
        else
            DisablePuzzleRPC();

        // 2. Trao item cho người chơi local
        InventoryManager inventory = _localActor.GetComponent<InventoryManager>();
        if (inventory != null && keyItemReward != null)
        {
            bool added = inventory.AddItem(keyItemReward);
            if (added)
                Debug.Log($"<color=cyan>[KeoCoP]</color> Trao {keyItemReward.itemName} cho {_localActor.name}.");
            else
                Debug.LogWarning("[KeoCoP] Túi đầy, không thể nhét item!");
        }

        // 3. Báo tiến độ cho UniversalObjectiveManager
        GameplayEvents.OnPuzzleSolved?.Invoke();

        // 4. Vòng Nhi thua → bỏ chạy (online/offline)
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(VongNhiLoseRPC), RpcTarget.MasterClient);
        else
            VongNhiLoseRPC();
        Debug.Log("[KeoCoP] Người chơi THẮNG! Nhận Chỉ đỏ.");
    }

    private void HandleLose(string reason = null)
    {
        _isMinigamePlaying = false;
        _waitingForArrowInput = false;
        string loseMessage = string.IsNullOrEmpty(reason) ? "THUA! Vòng Nhi kéo mốc qua vạch của bạn." : reason;
        ShowResult(false, loseMessage);

        // Vòng Nhi thắng → báo Ông Kẹ + bỏ chạy (online/offline)
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(VongNhiWinRPC), RpcTarget.MasterClient);
        else
            VongNhiWinRPC();

        // Mở khóa bàn kéo co cho lần thử tiếp theo
        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(SetPlayingRPC), RpcTarget.All, false);
        else
            SetPlayingRPC(false);

        Debug.Log("[KeoCoP] Người chơi THUA! Vòng Nhi báo Ông Kẹ...");
    }

    private void ShowResult(bool won, string message)
    {
        _showingResult = true;
        _resultTimer = resultDisplayTime;
        _overlayResult = message;

        if (resultPanel != null) resultPanel.SetActive(true);
        if (resultText != null)
        {
            string color = won ? "lime" : "red";
            resultText.text = $"<color={color}>{message}</color>";
        }
        if (statusText != null)
            statusText.text = string.Empty;
        if (timerText != null)
            timerText.text = string.Empty;
    }

    private void CloseUI()
    {
        _isMinigamePlaying = false;
        _showingResult = false;
        _waitingForArrowInput = false;
        CancelInvoke();
        if (keoCoCanvas != null) keoCoCanvas.gameObject.SetActive(false);
        if (resultPanel != null) resultPanel.SetActive(false);
        UnlockPlayerControls();
    }

    private void CancelMinigame()
    {
        Debug.Log("[KeoCoP] Người chơi hủy kéo co (F/Esc). Mở lại cho lần thử khác.");

        _isMinigamePlaying = false;
        _showingResult = false;
        _waitingForArrowInput = false;
        CancelInvoke();
        _overlayResult = string.Empty;

        if (keoCoCanvas != null) keoCoCanvas.gameObject.SetActive(false);
        if (resultPanel != null) resultPanel.SetActive(false);

        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(SetPlayingRPC), RpcTarget.All, false);
        else
            SetPlayingRPC(false);

        if (PhotonNetwork.IsConnectedAndReady)
            photonView.RPC(nameof(VongNhiCancelRPC), RpcTarget.MasterClient);
        else
            VongNhiCancelRPC();

        UnlockPlayerControls();
    }

    // ─── Visual Feedback ──────────────────────────────────────
    private void UpdateSliderColor()
    {
        if (ropeSlider == null) return;
        var fill = ropeSlider.fillRect?.GetComponent<Image>();
        if (fill == null) return;

        // Xanh lá = gần hoàn thành chuỗi, đỏ = mới bắt đầu / sắp thua
        float danger = 1f - _ropeValue;
        fill.color = Color.Lerp(Color.green, Color.red, danger);
    }

    // ─── RPC ──────────────────────────────────────────────────

    /// <summary>Đánh dấu bàn kéo co đang bận / rảnh cho tất cả client</summary>
    [PunRPC]
    private void SetPlayingRPC(bool playing)
    {
        _isAnyonePlaying = playing;
    }

    /// <summary>Khóa puzzle vĩnh viễn khi có người thắng</summary>
    [PunRPC]
    private void DisablePuzzleRPC()
    {
        _isSolved = true;
        _isAnyonePlaying = false;
        Collider col = GetComponent<Collider>();
        if (col != null) col.enabled = false;
        if (keoCoCanvas != null) keoCoCanvas.gameObject.SetActive(false);
        Debug.Log("[KeoCoP] Puzzle đã bị khóa vĩnh viễn (Thắng).");
    }

    /// <summary>MasterClient: Vòng Nhi vào trạng thái kéo co, nhìn về phía player</summary>
    [PunRPC]
    private void StartKeoCoRPC(int playerActorNumber)
    {
        if (PhotonNetwork.IsConnectedAndReady && !PhotonNetwork.IsMasterClient) return;
        TryResolveVongNhi();
        if (vongNhi == null) { Debug.LogWarning("[KeoCoP] Thiếu VongNhi reference!"); return; }

        Transform playerTf = null;
        foreach (var pv in FindObjectsOfType<PhotonView>())
        {
            if (pv.Owner?.ActorNumber == playerActorNumber && pv.gameObject.CompareTag("Player"))
            {
                playerTf = pv.transform;
                break;
            }
        }

        if (playerTf == null && _localActor != null)
            playerTf = _localActor.transform;

        if (playerTf == null)
        {
            Debug.LogWarning("[KeoCoP] Không tìm thấy player transform để bắt đầu kéo co.");
            return;
        }

        SnapVongNhiToPullPoint(playerTf);
        vongNhi.EnterKeoCo(playerTf);
    }

    /// <summary>MasterClient: Vòng Nhi thua → bỏ chạy</summary>
    [PunRPC]
    private void VongNhiLoseRPC()
    {
        if (PhotonNetwork.IsConnectedAndReady && !PhotonNetwork.IsMasterClient) return;
        vongNhi?.LoseKeoCo();
    }

    /// <summary>MasterClient: Vòng Nhi thắng → báo Ông Kẹ + bỏ chạy</summary>
    [PunRPC]
    private void VongNhiWinRPC()
    {
        if (PhotonNetwork.IsConnectedAndReady && !PhotonNetwork.IsMasterClient) return;
        vongNhi?.WinKeoCo();
    }

    [PunRPC]
    private void VongNhiCancelRPC()
    {
        if (PhotonNetwork.IsConnectedAndReady && !PhotonNetwork.IsMasterClient) return;
        vongNhi?.CancelKeoCo();
    }

    private bool EnsureUIReady()
    {
        if (keoCoCanvas == null)
        {
            var foundCanvas = GetComponentInChildren<Canvas>(true);
            if (foundCanvas != null) keoCoCanvas = foundCanvas;

            if (keoCoCanvas == null)
            {
                GameObject byName = GameObject.Find("KeoCoCanvas");
                if (byName != null)
                    keoCoCanvas = byName.GetComponent<Canvas>();
            }
        }

        if (keoCoCanvas != null)
        {
            if (ropeSlider == null)
                ropeSlider = keoCoCanvas.GetComponentInChildren<Slider>(true);

            if (statusText == null)
                statusText = FindTMPByName(keoCoCanvas, "StatusText");

            if (timerText == null)
                timerText = FindTMPByName(keoCoCanvas, "TimerText");

            if (resultPanel == null)
            {
                Transform rp = keoCoCanvas.transform.Find("ResultPanel");
                if (rp != null) resultPanel = rp.gameObject;
            }

            if (resultText == null)
                resultText = FindTMPByName(keoCoCanvas, "ResultText");
        }

        bool ready = keoCoCanvas != null && ropeSlider != null && statusText != null && timerText != null && resultPanel != null && resultText != null;

        if (!ready)
        {
            Debug.LogWarning($"[KeoCoP] UI canvas chưa đủ, sẽ dùng overlay fallback. Canvas:{keoCoCanvas != null}, Slider:{ropeSlider != null}, Status:{statusText != null}, Timer:{timerText != null}, ResultPanel:{resultPanel != null}, ResultText:{resultText != null}");
        }

        return true;
    }

    private void PrepareCanvasForMinigame()
    {
        if (keoCoCanvas == null) return;

        Transform t = keoCoCanvas.transform;
        while (t != null)
        {
            if (!t.gameObject.activeSelf)
                t.gameObject.SetActive(true);
            t = t.parent;
        }

        // Ép kiểu hiển thị để tránh trường hợp canvas world-space bị lệch/cực nhỏ
        keoCoCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
        keoCoCanvas.overrideSorting = true;
        keoCoCanvas.sortingOrder = 500;

        // Reset canvas scale để tránh trường hợp bị lưu thành 0,0,0
        keoCoCanvas.transform.localScale = Vector3.one;

        var canvasGroup = keoCoCanvas.GetComponent<CanvasGroup>();
        if (canvasGroup != null)
        {
            canvasGroup.alpha = 1f;
            canvasGroup.interactable = true;
            canvasGroup.blocksRaycasts = true;
        }
    }

    private TextMeshProUGUI FindTMPByName(Canvas canvas, string name)
    {
        if (canvas == null) return null;

        Transform tr = canvas.transform.Find(name);
        if (tr != null)
            return tr.GetComponent<TextMeshProUGUI>();

        var tmps = canvas.GetComponentsInChildren<TextMeshProUGUI>(true);
        foreach (var tmp in tmps)
        {
            if (tmp.name == name)
                return tmp;
        }

        return null;
    }

    private void ForceShowUIElement(Object uiObj)
    {
        if (uiObj == null) return;

        GameObject go = null;
        if (uiObj is Component comp)
            go = comp.gameObject;
        else if (uiObj is GameObject obj)
            go = obj;

        if (go == null) return;

        Transform tr = go.transform;
        while (tr != null)
        {
            if (!tr.gameObject.activeSelf)
                tr.gameObject.SetActive(true);

            var cg = tr.GetComponent<CanvasGroup>();
            if (cg != null)
            {
                cg.alpha = 1f;
                cg.interactable = true;
                cg.blocksRaycasts = true;
            }

            tr = tr.parent;
        }

        if (uiObj is TextMeshProUGUI tmp)
        {
            var color = tmp.color;
            color.a = 1f;
            if (color.maxColorComponent < 0.15f)
            {
                color = Color.white;
            }
            tmp.color = color;
        }
    }

    private bool TryConsumeArrowInput(out TugArrow pressedArrow)
    {
        pressedArrow = TugArrow.Up;

        if (Keyboard.current == null)
            return false;

        if (Keyboard.current.upArrowKey.wasPressedThisFrame)
        {
            pressedArrow = TugArrow.Up;
            return true;
        }

        if (Keyboard.current.downArrowKey.wasPressedThisFrame)
        {
            pressedArrow = TugArrow.Down;
            return true;
        }

        if (Keyboard.current.leftArrowKey.wasPressedThisFrame)
        {
            pressedArrow = TugArrow.Left;
            return true;
        }

        if (Keyboard.current.rightArrowKey.wasPressedThisFrame)
        {
            pressedArrow = TugArrow.Right;
            return true;
        }

        return false;
    }

    private void ResolveInput(TugArrow pressedArrow)
    {
        TugArrow expectedArrow = _arrowSequence[_currentInputIndex];
        if (pressedArrow != expectedArrow)
        {
            _ropeValue -= playerPenaltyOnWrong;
            _ropeValue = Mathf.Clamp01(_ropeValue);
            UpdateWorldMarkerVisual();
            if (ropeSlider != null)
                ropeSlider.value = _ropeValue;
            UpdateSliderColor();

            _currentInputIndex = 0;
            _sequenceTimer = Mathf.Max(1.2f, Mathf.Min(3.5f, matchDuration * 0.1f));
            UpdateSequenceStatus($"Sai phím! Cần {GetArrowMarkup(expectedArrow)} - mất nhịp.");
            return;
        }

        _currentInputIndex += 1;
        _ropeValue += playerPullPerCorrect;
        _ropeValue = Mathf.Clamp01(_ropeValue);
        UpdateWorldMarkerVisual();

        if (ropeSlider != null)
            ropeSlider.value = _ropeValue;

        UpdateSliderColor();

        if (_ropeValue >= playerWinLine)
        {
            HandleWin();
            return;
        }

        if (_currentInputIndex >= sequenceLength)
        {
            BuildArrowSequence();
            _currentInputIndex = 0;
            _sequenceTimer = Mathf.Max(1.2f, Mathf.Min(3.5f, matchDuration * 0.1f));
            UpdateSequenceStatus("Kéo tốt! Chuỗi mới...");
            return;
        }

        UpdateSequenceStatus("Đúng rồi, tiếp tục kéo!");
    }

    private void UpdateTimerLabel()
    {
        if (timerText == null) return;

        if (_waitingForArrowInput)
            timerText.text = $"Trận: {Mathf.CeilToInt(Mathf.Max(0f, _matchTimer))}s | Chuỗi: {Mathf.CeilToInt(Mathf.Max(0f, _sequenceTimer))}s";
        else
            timerText.text = string.Empty;
    }

    private void BuildArrowSequence()
    {
        int count = Mathf.Max(1, sequenceLength);
        _arrowSequence = new TugArrow[count];

        for (int i = 0; i < count; i++)
            _arrowSequence[i] = (TugArrow)Random.Range(0, 4);
    }

    private void UpdateSequenceStatus(string prefix)
    {
        _overlayHint = prefix;
        if (statusText == null || _arrowSequence == null) return;

        string sequenceText = string.Empty;
        for (int i = 0; i < _arrowSequence.Length; i++)
        {
            string arrow = GetArrowMarkup(_arrowSequence[i]);

            if (i < _currentInputIndex)
                sequenceText += $"<color=lime>{arrow}</color> ";
            else if (i == _currentInputIndex)
                sequenceText += $"<color=yellow><size=140%>{arrow}</size></color> ";
            else
                sequenceText += $"<color=white>{arrow}</color> ";
        }

        statusText.text =
            $"Mốc dây: {_ropeValue:0.00} | Vạch người chơi >= {playerWinLine:0.00} | Vạch Vòng Nhi <= {vongNhiWinLine:0.00}\n" +
            $"{prefix}\n{sequenceText}\n<color=yellow>{_currentInputIndex}/{sequenceLength} đúng</color>";
    }

    private void OnGUI()
    {
        if (!useRuntimeOverlayUI) return;
        if (!_isMinigamePlaying && !_showingResult) return;

        float panelW = Mathf.Min(Screen.width * 0.78f, 900f);
        float panelH = 220f;
        Rect panel = new Rect((Screen.width - panelW) * 0.5f, 30f, panelW, panelH);
        GUI.Box(panel, "KEO CO - NHAP DUNG CHUOI PHIM");

        GUIStyle text = new GUIStyle(GUI.skin.label)
        {
            alignment = TextAnchor.UpperCenter,
            fontSize = 20,
            normal = { textColor = Color.white },
            wordWrap = true,
        };

        GUI.Label(new Rect(panel.x + 20f, panel.y + 35f, panel.width - 40f, 32f), _overlayHint, text);

        GUIStyle scoreStyle = new GUIStyle(GUI.skin.label)
        {
            alignment = TextAnchor.UpperCenter,
            fontSize = 18,
            normal = { textColor = Color.cyan },
        };
        GUI.Label(new Rect(panel.x + 20f, panel.y + 60f, panel.width - 40f, 24f), $"Moc day {_ropeValue:0.00} | Thang >= {playerWinLine:0.00} | Thua <= {vongNhiWinLine:0.00}", scoreStyle);

        if (_isMinigamePlaying && _arrowSequence != null)
        {
            GUIStyle seqStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 36,
                normal = { textColor = Color.yellow },
            };

            GUI.Label(new Rect(panel.x + 20f, panel.y + 92f, panel.width - 40f, 52f), BuildSequenceDebugText(), seqStyle);

            GUIStyle info = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 20,
                normal = { textColor = Color.cyan },
            };
            GUI.Label(new Rect(panel.x + 20f, panel.y + 150f, panel.width - 40f, 30f), $"{_currentInputIndex}/{sequenceLength} dung - {Mathf.CeilToInt(Mathf.Max(0f, _sequenceTimer))}s", info);
        }

        if (_showingResult)
        {
            GUIStyle result = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                fontSize = 26,
                normal = { textColor = Color.green },
            };
            if (_overlayResult.Contains("THUA")) result.normal.textColor = Color.red;

            GUI.Label(new Rect(panel.x + 20f, panel.y + 148f, panel.width - 40f, 50f), _overlayResult, result);
        }
    }

    private void ResetMatchState()
    {
        _ropeValue = 0.5f;
        _matchTimer = Mathf.Max(5f, matchDuration);
        _showingResult = false;
        _currentInputIndex = 0;
        _waitingForArrowInput = false;
        UpdateWorldMarkerVisual();
    }

    private void StartMatch()
    {
        _isMinigamePlaying = true;
        _showingResult = false;
        _waitingForArrowInput = true;
        _currentInputIndex = 0;
        _matchTimer = Mathf.Max(5f, matchDuration);
        _overlayResult = string.Empty;

        if (sequenceLength <= 0)
            sequenceLength = 5;

        _sequenceTimer = Mathf.Max(1.2f, Mathf.Min(3.5f, _matchTimer * 0.1f));

        BuildArrowSequence();
        UpdateWorldMarkerVisual();

        if (ropeSlider != null)
            ropeSlider.value = _ropeValue;

        if (resultPanel != null)
            resultPanel.SetActive(false);

        UpdateSequenceStatus("Bắt đầu kéo! Đưa mốc qua vạch của bạn.");
        UpdateTimerLabel();
    }

    private string BuildSequenceDebugText()
    {
        if (_arrowSequence == null || _arrowSequence.Length == 0)
            return string.Empty;

        string text = string.Empty;
        for (int i = 0; i < _arrowSequence.Length; i++)
        {
            string arrow = GetArrowMarkup(_arrowSequence[i]);
            if (i == _currentInputIndex)
                text += $"[{arrow}] ";
            else
                text += arrow + " ";
        }
        return text.Trim();
    }

    private string GetArrowMarkup(TugArrow arrow)
    {
        switch (arrow)
        {
            case TugArrow.Up: return "↑";
            case TugArrow.Down: return "↓";
            case TugArrow.Left: return "←";
            case TugArrow.Right: return "→";
            default: return "?";
        }
    }

    private void TryResolveVongNhi()
    {
        if (vongNhi != null || !autoFindVongNhiIfMissing)
            return;

        if (!string.IsNullOrEmpty(vongNhiTag))
        {
            GameObject tagged = GameObject.FindGameObjectWithTag(vongNhiTag);
            if (tagged != null)
            {
                vongNhi = tagged.GetComponent<VongNhiMonster>();
                if (vongNhi != null)
                    return;
            }
        }

        vongNhi = FindObjectOfType<VongNhiMonster>();
    }

    private void UpdateWorldMarkerVisual()
    {
        if (ropeCenterMarker == null || markerLeftLimit == null || markerRightLimit == null)
            return;

        ropeCenterMarker.position = Vector3.Lerp(markerLeftLimit.position, markerRightLimit.position, _ropeValue);
    }

    private bool TryCheckWorldLineOutcome(out bool playerWin, out string loseReason)
    {
        playerWin = false;
        loseReason = "Mốc giữa dây đã qua vạch của Vòng Nhi.";

        if (ropeCenterMarker == null || markerLeftLimit == null || markerRightLimit == null)
            return false;

        if (playerGroundLine == null && vongNhiGroundLine == null)
            return false;

        Vector3 axis = markerRightLimit.position - markerLeftLimit.position;
        float axisLength = axis.magnitude;
        if (axisLength < 0.001f)
            return false;

        Vector3 axisNorm = axis / axisLength;
        float markerProgress = Vector3.Dot(ropeCenterMarker.position - markerLeftLimit.position, axisNorm) / axisLength;

        if (playerGroundLine != null)
        {
            float playerLineProgress = Vector3.Dot(playerGroundLine.position - markerLeftLimit.position, axisNorm) / axisLength;
            if (markerProgress >= playerLineProgress)
            {
                playerWin = true;
                return true;
            }
        }

        if (vongNhiGroundLine != null)
        {
            float vongNhiLineProgress = Vector3.Dot(vongNhiGroundLine.position - markerLeftLimit.position, axisNorm) / axisLength;
            if (markerProgress <= vongNhiLineProgress)
            {
                playerWin = false;
                loseReason = "Mốc giữa dây đã qua vạch của Vòng Nhi.";
                return true;
            }
        }

        return false;
    }

    private void SnapPlayerToPullPoint(GameObject actor)
    {
        if (actor == null || playerPullPoint == null) return;

        actor.transform.SetPositionAndRotation(playerPullPoint.position, playerPullPoint.rotation);
    }

    private void SnapVongNhiToPullPoint(Transform playerTf)
    {
        if (vongNhi == null) return;

        if (vongNhiPullPoint != null)
        {
            vongNhi.transform.SetPositionAndRotation(vongNhiPullPoint.position, vongNhiPullPoint.rotation);
        }

        if (playerTf != null)
        {
            Vector3 dir = playerTf.position - vongNhi.transform.position;
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.01f)
                vongNhi.transform.rotation = Quaternion.LookRotation(dir.normalized);
        }
    }

    private void LockPlayerControls(GameObject actor)
    {
        if (!lockPlayerDuringMinigame || actor == null || _controlsLocked) return;

        _cachedFpsController = actor.GetComponent<FPSController>();
        if (_cachedFpsController != null)
            _cachedFpsController.enabled = false;

        _cachedPlayerInteract = actor.GetComponent<PlayerInteract>();
        if (_cachedPlayerInteract != null)
            _cachedPlayerInteract.enabled = false;

        _controlsLocked = true;

        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }

    private void UnlockPlayerControls()
    {
        if (!_controlsLocked) return;

        if (_cachedFpsController != null)
            _cachedFpsController.enabled = true;

        if (_cachedPlayerInteract != null)
            _cachedPlayerInteract.enabled = true;

        _cachedFpsController = null;
        _cachedPlayerInteract = null;
        _controlsLocked = false;

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    private void OnDisable()
    {
        UnlockPlayerControls();
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        if (sequenceLength <= 0)
            sequenceLength = 1;

        if (matchDuration <= 0f)
            matchDuration = 5f;

        playerWinLine = Mathf.Clamp(playerWinLine, 0.55f, 0.98f);
        vongNhiWinLine = Mathf.Clamp(vongNhiWinLine, 0.02f, 0.45f);

        if (vongNhiPullPerSecond < 0f)
            vongNhiPullPerSecond = 0f;

        if (playerPullPerCorrect <= 0f)
            playerPullPerCorrect = 0.01f;

        if (playerPenaltyOnWrong < 0f)
            playerPenaltyOnWrong = 0f;
    }
#endif
}
