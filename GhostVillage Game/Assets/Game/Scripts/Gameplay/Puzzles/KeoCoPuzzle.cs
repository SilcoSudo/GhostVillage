using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.InputSystem;
using Photon.Pun;
using GhostVillage.Gameplay.Monsters.VongNhi;
using Game.Scripts.Gameplay.Core;

/// <summary>
/// Puzzle: Kéo co 
/// ─────────────────────────────────────────────────────────
/// Cách chơi:
///   - Người chơi tiếp cận cây cột → thấy prompt "Kéo co (F)"
///   - Nhấn F để bắt đầu
///   - Spam E để kéo thanh về phía mình (phía phải)
///   - AI (Ông Kẹ bóng) liên tục kéo về phía trái
///   - Thắng (≥ winThreshold): Nhận Chỉ đỏ
///   - Thua (≤ loseThreshold hoặc hết giờ): Ông Kẹ chạy đến đuổi người chơi
///
/// Nhấn E nhiều lần nhanh = kéo mạnh hơn
/// ─────────────────────────────────────────────────────────
/// Inspector Setup:
///   1. Gắn script này vào object Cột/Dây kéo co (cần Collider + PhotonView)
///   2. Tạo Canvas UI (Screen Space Overlay) và assign vào keoCoCanvas
///   3. Tạo Slider trong Canvas (range 0-1, start 0.5) assign vào ropeSlider
///   4. Assign TextMeshProUGUI cho statusText và timerText
///   5. Assign OngKeMonster reference vào ongKe
///   6. Set layer object này = "Interactable"
/// </summary>
public class KeoCoPuzzle : MonoBehaviourPun, IInteractable
{
    [Header("--- Phần Thưởng ---")]
    [Tooltip("Key Item trao khi thắng (kéo KeyItemSO vào đây)")]
    public KeyItemSO keyItemReward;

    // ─── UI ───────────────────────────────────────────────────
    [Header("--- UI ---")]
    [Tooltip("Canvas kéo co (Screen Space Overlay). Bắt đầu tắt)")]
    [SerializeField] private Canvas keoCoCanvas;
    [Tooltip("Slider 0=AI thắng, 1=Player thắng. Start value = 0.5")]
    [SerializeField] private Slider ropeSlider;
    [Tooltip("Dòng chữ 'Nhấn E liên tục để kéo!' / kết quả")]
    [SerializeField] private TextMeshProUGUI statusText;
    [Tooltip("Đồng hồ đếm ngược còn lại")]
    [SerializeField] private TextMeshProUGUI timerText;
    [Tooltip("Panel kết quả (Thắng/Thua), tắt khi bắt đầu)")]
    [SerializeField] private GameObject resultPanel;
    [Tooltip("Text trong result panel")]
    [SerializeField] private TextMeshProUGUI resultText;

    // ─── Vòng Nhi ─────────────────────────────────────────────
    [Header("--- Vòng Nhi ---")]
    [Tooltip("VongNhiMonster trong scene – đối thủ trong kéo co")]
    [SerializeField] private VongNhiMonster vongNhi;

    // ─── Balance ──────────────────────────────────────────────
    [Header("--- Balance ---")]
    [Tooltip("Lượng slider tăng mỗi lần nhấn E")]
    [SerializeField] private float playerPullPerPress = 0.07f;
    [Tooltip("Tốc độ AI kéo ngược liên tục (per second)")]
    [SerializeField] private float aiPullSpeed = 0.04f;
    [Tooltip("Giá trị slider để thắng (0-1)")]
    [Range(0.6f, 1f)]
    [SerializeField] private float winThreshold = 0.82f;
    [Tooltip("Giá trị slider để thua (0-1)")]
    [Range(0f, 0.4f)]
    [SerializeField] private float loseThreshold = 0.18f;
    [Tooltip("Thời gian tối đa của một lần kéo co (giây)")]
    [SerializeField] private float maxDuration = 30f;
    [Tooltip("Thời gian hiển thị màn hình kết quả trước khi đóng UI (giây)")]
    [SerializeField] private float resultDisplayTime = 2f;

    // ─── Runtime ──────────────────────────────────────────────
    private bool _isSolved = false;          // puzzle đã bị ai đó giải (sau khi thắng)
    private bool _isMinigamePlaying = false; // local: đang trong minigame
    private bool _isAnyonePlaying = false;   // synced: đang có người kéo
    private float _ropeValue = 0.5f;
    private float _timer = 0f;
    private float _resultTimer = 0f;
    private bool _showingResult = false;
    private GameObject _localActor = null;   // người chơi local đang kéo

    // ─── IInteractable ────────────────────────────────────────
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

        // Báo cho tất cả client là đang bắt đầu
        photonView.RPC(nameof(SetPlayingRPC), RpcTarget.All, true);
        StartLocalMinigame(actor);
    }

    // ─── Minigame Start ───────────────────────────────────────
    private void StartLocalMinigame(GameObject actor)
    {
        _localActor = actor;
        _isMinigamePlaying = true;
        _ropeValue = 0.5f;
        _timer = 0f;
        _showingResult = false;

        if (keoCoCanvas != null) keoCoCanvas.gameObject.SetActive(true);
        if (resultPanel != null) resultPanel.SetActive(false);
        if (ropeSlider != null) ropeSlider.value = _ropeValue;
        if (statusText != null) statusText.text = "Nhấn <color=yellow>E</color> liên tục để kéo!";

        // Thông báo MasterClient để Vòng Nhi đứng kéo co
        int actorNum = actor.GetComponent<PhotonView>()?.Owner?.ActorNumber ?? -1;
        photonView.RPC(nameof(StartKeoCoRPC), RpcTarget.MasterClient, actorNum);

        Debug.Log("[KeoCoP] Bắt đầu kéo co với Vòng Nhi!");
    }

    // ─── Update Loop ──────────────────────────────────────────
    private void Update()
    {
        if (!_isMinigamePlaying) return;

        // Hiển thị kết quả xong → đóng UI
        if (_showingResult)
        {
            _resultTimer -= Time.deltaTime;
            if (_resultTimer <= 0f) CloseUI();
            return;
        }

        // Đếm giờ
        _timer += Time.deltaTime;
        float remaining = Mathf.Max(0f, maxDuration - _timer);
        if (timerText != null) timerText.text = $"{remaining:F0}s";

        // AI kéo liên tục
        _ropeValue -= aiPullSpeed * Time.deltaTime;

        // Player nhấn E
        if (Keyboard.current != null && Keyboard.current.eKey.wasPressedThisFrame)
            _ropeValue += playerPullPerPress;

        // Hết giờ → thua ngay
        if (_timer >= maxDuration) _ropeValue = loseThreshold - 0.01f;

        _ropeValue = Mathf.Clamp01(_ropeValue);
        if (ropeSlider != null) ropeSlider.value = _ropeValue;

        // Cập nhật màu slider theo tiến độ
        UpdateSliderColor();

        // Kiểm tra thắng/thua
        if (_ropeValue >= winThreshold)
            HandleWin();
        else if (_ropeValue <= loseThreshold)
            HandleLose();
    }

    // ─── Win / Lose ───────────────────────────────────────────
    private void HandleWin()
    {
        _isMinigamePlaying = false;
        ShowResult(true);

        // 1. Khóa puzzle với tất cả client (buffered)
        photonView.RPC(nameof(DisablePuzzleRPC), RpcTarget.AllBuffered);

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

        // 4. Vòng Nhi thua → bỏ chạy
        photonView.RPC(nameof(VongNhiLoseRPC), RpcTarget.MasterClient);
        Debug.Log("[KeoCoP] Người chơi THẮNG! Nhận Chỉ đỏ.");
    }

    private void HandleLose()
    {
        _isMinigamePlaying = false;
        ShowResult(false);

        // Vòng Nhi thắng → báo Ông Kẹ + bỏ chạy
        photonView.RPC(nameof(VongNhiWinRPC), RpcTarget.MasterClient);

        // Mở khóa bàn kéo co cho lần thử tiếp theo
        photonView.RPC(nameof(SetPlayingRPC), RpcTarget.All, false);

        Debug.Log("[KeoCoP] Người chơi THUA! Vòng Nhi báo Ông Kẹ...");
    }

    private void ShowResult(bool won)
    {
        _showingResult = true;
        _resultTimer = resultDisplayTime;

        if (resultPanel != null) resultPanel.SetActive(true);
        if (resultText != null)
        {
            resultText.text = won
                ? "<color=lime>Thắng!\nNhận được Chỉ đỏ!</color>"
                : "<color=red>Thua!\nChạy đi!</color>";
        }
        if (statusText != null) statusText.text = "";
    }

    private void CloseUI()
    {
        _isMinigamePlaying = false;
        _showingResult = false;
        if (keoCoCanvas != null) keoCoCanvas.gameObject.SetActive(false);
    }

    // ─── Visual Feedback ──────────────────────────────────────
    private void UpdateSliderColor()
    {
        if (ropeSlider == null) return;
        var fill = ropeSlider.fillRect?.GetComponent<Image>();
        if (fill == null) return;

        // Xanh lá = đang thắng, đỏ = nguy hiểm
        float danger = 1f - Mathf.InverseLerp(loseThreshold, winThreshold, _ropeValue);
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
        if (!PhotonNetwork.IsMasterClient) return;
        if (vongNhi == null) { Debug.LogWarning("[KeoCoP] Thiếu VongNhi reference!"); return; }
        foreach (var pv in FindObjectsOfType<PhotonView>())
        {
            if (pv.Owner?.ActorNumber == playerActorNumber && pv.gameObject.CompareTag("Player"))
            {
                vongNhi.EnterKeoCo(pv.transform);
                return;
            }
        }
    }

    /// <summary>MasterClient: Vòng Nhi thua → bỏ chạy</summary>
    [PunRPC]
    private void VongNhiLoseRPC()
    {
        if (!PhotonNetwork.IsMasterClient) return;
        vongNhi?.LoseKeoCo();
    }

    /// <summary>MasterClient: Vòng Nhi thắng → báo Ông Kẹ + bỏ chạy</summary>
    [PunRPC]
    private void VongNhiWinRPC()
    {
        if (!PhotonNetwork.IsMasterClient) return;
        vongNhi?.WinKeoCo();
    }

#if UNITY_EDITOR
    private void OnValidate()
    {
        if (winThreshold <= loseThreshold)
            Debug.LogWarning("[KeoCoP] winThreshold phải > loseThreshold!");
    }
#endif
}
