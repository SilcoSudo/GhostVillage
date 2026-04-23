using UnityEngine;
using Photon.Pun;
using Photon.Realtime;
using Game.Scripts.Gameplay.Core;
using Game.Core.Player.RayCast; 
using Game.Scripts.Core.Game;

[RequireComponent(typeof(PhotonView))]
public class CenserEscapeManager : MonoBehaviourPun, IInteractable
{
    [Header("=== GIAI ĐOẠN 1: MỞ CỔNG (CENSER LOGIC) ===")]
    [Tooltip("Dòng chữ hiện lên khi trỏ vào lúc chưa mở cổng")]
    public string promptOpenGate = "Góp Chìa Khóa Mở Cổng";
    [Tooltip("Tổng số KeyItem cả team cần có")]
    public int requiredTotalKeys = 3;
    [Tooltip("Prefab Cổng sẽ spawn ra (Đặt trong Resources)")]
    public GameObject exitGatePrefab;
    [Tooltip("Vị trí spawn cổng")]
    public Transform gateSpawnPoint;
    [Tooltip("Vật phẩm (Con Gà) sẽ phát cho người chơi khi cổng mở")]
    public ItemDataSO escapeToolItem;

    [Header("=== GIAI ĐOẠN 2: TRỐN THOÁT (ESCAPE LOGIC) ===")]
    [Tooltip("Bán kính vùng an toàn. Ai đứng ngoài vòng này sẽ chết!")]
    public float escapeRadius = 6.0f;
    [Tooltip("Tâm của vùng an toàn (Thường đặt trùng với Gate Spawn Point)")]
    public Transform escapeCenterPoint;

    // --- State Variables ---
    private bool _isAltarActivated = false;
    private bool _isEscapePhaseActive = false;
    private bool _isEscapeSequenceTriggered = false;

    private void Start()
    {
        if (escapeCenterPoint == null && gateSpawnPoint != null)
            escapeCenterPoint = gateSpawnPoint;
        else if (escapeCenterPoint == null)
            escapeCenterPoint = transform;
    }

    // Lắng nghe GameState để biết khi nào Server cho phép trốn
    private void OnEnable() { GameplayEvents.OnGameStateChanged += OnStateChanged; }
    private void OnDisable() { GameplayEvents.OnGameStateChanged -= OnStateChanged; }
    private void OnStateChanged(GameState state)
    {
        if (state == GameState.EscapePhase) _isEscapePhaseActive = true;
    }

    // --- IInteractable Implementation ---
    public string GetPromptMessage()
    {
        if (_isEscapeSequenceTriggered) return "Escaping...";

        // Nếu chưa mở cổng
        if (!_isAltarActivated) 
        {
            return $"{promptOpenGate} (Cần {requiredTotalKeys} keys)";
        }

        // Nếu cổng đã mở, chờ server chuyển Phase
        if (!_isEscapePhaseActive) return "Waiting for Server...";

        // Nếu đã sẵn sàng tẩu thoát
        return "TẨU THOÁT! (F)";
    }

    public void Interact(GameObject actor)
    {
        if (_isEscapeSequenceTriggered) return;

        // BƯỚC 1: NẾU CHƯA MỞ CỔNG -> GỌI MASTER CHECK CHÌA KHÓA
        if (!_isAltarActivated)
        {
            Debug.Log($"[CenserEscape] Người chơi {actor.name} yêu cầu mở cổng...");
            photonView.RPC(nameof(CheckAltarConditionRPC), RpcTarget.MasterClient);
            return;
        }

        // BƯỚC 2: CỔNG ĐÃ MỞ -> BẤM ĐỂ CHẠY TRỐN
        if (!_isEscapePhaseActive)
        {
            Debug.LogWarning("<color=yellow>[CenserEscape] Server chưa kịp chuyển Phase! Chờ chút rồi bấm lại!</color>");
            return;
        }

        // Bấm phát cuối để tính toán ai sống ai chết
        photonView.RPC(nameof(TriggerEscapeSequenceRPC), RpcTarget.AllBuffered);
        actor.SendMessage("RefreshInteractUI", SendMessageOptions.DontRequireReceiver);
    }

    // ==========================================
    // LOGIC GIAI ĐOẠN 1 (MỞ CỔNG)
    // ==========================================
    [PunRPC]
    private void CheckAltarConditionRPC()
    {
        if (!PhotonNetwork.IsMasterClient) return;

        int currentTotalKeys = 0;
        foreach (Player p in PhotonNetwork.PlayerList)
        {
            if (p.CustomProperties.ContainsKey("KeyCount"))
            {
                currentTotalKeys += (int)p.CustomProperties["KeyCount"];
            }
        }

        Debug.Log($"[CenserEscape] Tổng Key cả team: {currentTotalKeys}/{requiredTotalKeys}");

        if (currentTotalKeys >= requiredTotalKeys)
        {
            if (exitGatePrefab != null && gateSpawnPoint != null)
            {
                PhotonNetwork.Instantiate(exitGatePrefab.name, gateSpawnPoint.position, gateSpawnPoint.rotation);
            }

            // Gọi mọi người kích hoạt cổng
            photonView.RPC(nameof(ActivateAltarSuccessRPC), RpcTarget.AllBuffered);
        }
        else
        {
            Debug.LogWarning("[CenserEscape] Chưa đủ chìa khóa!");
        }
    }

    [PunRPC]
    private void ActivateAltarSuccessRPC()
    {
        if (_isAltarActivated) return;
        _isAltarActivated = true;

        Debug.Log("<color=green>[CenserEscape] ĐÃ ĐỦ CHÌA KHÓA! CỔNG ĐÃ MỞ!</color>");

        // Xóa đồ cũ, phát gà
        ProcessLocalPlayerInventory();

        // Bắn sự kiện để Game Manager chuyển sang EscapePhase
        GameplayEvents.OnAltarActivated?.Invoke();
    }

    private void ProcessLocalPlayerInventory()
    {
        var inv = InventoryManager.LocalInstance;
        if (inv != null)
        {
            inv.ClearInventoryAndLock();
            if (escapeToolItem != null)
            {
                inv.AddItem(escapeToolItem);
                inv.SelectSlot(0);
            }
        }
    }

    // ==========================================
    // LOGIC GIAI ĐOẠN 2 (TRỐN THOÁT CHUNG)
    // ==========================================
    [PunRPC]
    private void TriggerEscapeSequenceRPC()
    {
        if (_isEscapeSequenceTriggered) return;
        _isEscapeSequenceTriggered = true;

        CheckWhoEscaped();
    }

    private void CheckWhoEscaped()
    {
        FPSController localPlayer = null;
        var allPlayers = FindObjectsByType<FPSController>(FindObjectsSortMode.None);
        foreach (var p in allPlayers)
        {
            if (p.photonView.IsMine)
            {
                localPlayer = p;
                break;
            }
        }

        if (localPlayer != null)
        {
            Vector3 center = escapeCenterPoint != null ? escapeCenterPoint.position : transform.position;
            float distance = Vector3.Distance(center, localPlayer.transform.position);

            if (distance <= escapeRadius)
            {
                Debug.Log("<color=green>[CenserEscape] Đứng trong vùng an toàn! Trốn thoát thành công!</color>");
                GameplayEvents.OnLocalPlayerRequestEscape?.Invoke(); // Gọi UI Chiến Thắng
            }
            else
            {
                Debug.Log($"<color=red>[CenserEscape] Đứng quá xa ({distance}m)! Bị quái xé xác!</color>");
                GameplayEvents.OnPlayerStatusChanged?.Invoke(PhotonNetwork.LocalPlayer.ActorNumber, PlayerMatchStatus.Eliminated); // Gọi UI Chết
            }
        }
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.green;
        Vector3 center = escapeCenterPoint != null ? escapeCenterPoint.position : transform.position;
        Gizmos.DrawWireSphere(center, escapeRadius);
    }
}