using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;
using Game.Scripts.Gameplay.Core;
using VContainer;
using Game.Scripts.Core.Game;

[RequireComponent(typeof(PhotonView))]
public class BoatEscapeManager : MonoBehaviourPun, IInteractable
{
    [Header("=== MÃ ID CỦA 3 MÓN ĐỒ ===")]
    public string sparkPlugID = "ITEM_SPARKPLUG";
    public string jerryCanID = "ITEM_JERRYCAN";
    public string oarBladeID = "ITEM_OARBLADE";

    [Header("=== LOGIC TẨU THOÁT ===")]
    [Tooltip("Bán kính vùng đất an toàn. Ai đứng ngoài vòng này sẽ bị bỏ lại!")]
    public float escapeRadius = 6.0f;
    public Transform escapeCenterPoint;

    [Header("=== ÂM THANH ===")]
    public AudioSource boatAudioSource;
    [Inject] private GameAudioManager _audioManager;

    private bool _hasSparkPlug = false;
    private bool _hasJerryCan = false;
    private bool _hasOarBlade = false;
    private bool _isEscaping = false;

    // [FIX 1]: Cờ kiểm soát chống kẹt mạng
    private bool _isEscapePhaseActive = false;

    private void Start()
    {
        if (_audioManager == null)
            _audioManager = FindFirstObjectByType<GameAudioManager>();

        if (escapeCenterPoint == null)
            escapeCenterPoint = transform;
    }

    // [FIX 1]: Lắng nghe GameState để biết khi nào Server sẵn sàng
    private void OnEnable() { GameplayEvents.OnGameStateChanged += OnStateChanged; }
    private void OnDisable() { GameplayEvents.OnGameStateChanged -= OnStateChanged; }
    private void OnStateChanged(GameState state)
    {
        if (state == GameState.EscapePhase) _isEscapePhaseActive = true;
    }

    public string GetPromptMessage()
    {
        if (_isEscaping) return "Đang nổ máy cút khỏi đảo...";

        int count = 0;
        if (_hasSparkPlug) count++;
        if (_hasJerryCan) count++;
        if (_hasOarBlade) count++;

        if (count == 3)
        {
            // Tránh người chơi bấm F trước khi Server chuyển phase
            if (!_isEscapePhaseActive) return "Hệ thống đang đồng bộ... chờ xíu";
            return "NỔ MÁY TẨU THOÁT! (F)";
        }

        return $"Lắp ráp phụ tùng ({count}/3) (F)";
    }

    public void Interact(GameObject actor)
    {
        if (_isEscaping) return;

        var inventory = actor.GetComponent<InventoryManager>();
        if (inventory == null) return;

        // BƯỚC 1: LẮP ĐỒ
        if (!_hasSparkPlug || !_hasJerryCan || !_hasOarBlade)
        {
            int currentSlot = inventory.currentSlotIndex;
            if (currentSlot < inventory.items.Length)
            {
                ItemDataSO heldItem = inventory.items[currentSlot];
                if (heldItem != null)
                {
                    TryInstallPart(inventory, heldItem);
                    return;
                }
            }
            Debug.Log("<color=yellow>[Boat] Trong tay không cầm đúng phụ tùng!</color>");
            return;
        }

        // BƯỚC 2: TẨU THOÁT
        if (!_isEscapePhaseActive)
        {
            Debug.LogWarning("<color=yellow>[Boat] Server chưa kịp chuyển Phase, ngón tay sếp bấm nhanh quá! Chờ 0.5s rồi bấm lại!</color>");
            return; // Đẩy ra, không cho kẹt biến _isEscaping
        }

        photonView.RPC(nameof(TriggerEscapeSequenceRPC), RpcTarget.AllBuffered);
        actor.SendMessage("RefreshInteractUI", SendMessageOptions.DontRequireReceiver);
    }

    private void TryInstallPart(InventoryManager inventory, ItemDataSO heldItem)
    {
        string id = heldItem.itemId;
        string partToInstall = "";

        if (id == sparkPlugID && !_hasSparkPlug) partToInstall = "SPARKPLUG";
        else if (id == jerryCanID && !_hasJerryCan) partToInstall = "JERRYCAN";
        else if (id == oarBladeID && !_hasOarBlade) partToInstall = "OARBLADE";

        if (!string.IsNullOrEmpty(partToInstall))
        {
            if (inventory.RemoveItem(heldItem))
            {
                photonView.RPC(nameof(InstallPartRPC), RpcTarget.AllBuffered, partToInstall);
            }
        }
    }

    [PunRPC]
    private void InstallPartRPC(string partType)
    {
        if (_audioManager != null && boatAudioSource != null)
        {
            AudioClip installClip = _audioManager.GetClip("ITEM_PICKUP");
            if (installClip != null) boatAudioSource.PlayOneShot(installClip);
        }

        switch (partType)
        {
            case "SPARKPLUG": _hasSparkPlug = true; break;
            case "JERRYCAN": _hasJerryCan = true; break;
            case "OARBLADE": _hasOarBlade = true; break;
        }

        if (_hasSparkPlug && _hasJerryCan && _hasOarBlade)
        {
            Debug.Log("<color=green>[Boat] ĐÃ NẠP ĐỦ 3 PHỤ TÙNG! BÁO SERVER MỞ PHASE TRỐN THOÁT!</color>");
            if (PhotonNetwork.IsMasterClient)
            {
                GameplayEvents.OnAltarActivated?.Invoke();
            }
        }
    }

    [PunRPC]
    private void TriggerEscapeSequenceRPC()
    {
        if (_isEscaping) return;
        _isEscaping = true;

        if (_audioManager != null && boatAudioSource != null)
        {
            AudioClip engineClip = _audioManager.GetClip("BOAT_ENGINE_START");
            if (engineClip != null) boatAudioSource.PlayOneShot(engineClip);
        }

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
                Debug.Log("<color=green>[Boat] Chạy kịp lên bãi đất! Bắn sự kiện trốn thoát thành công!</color>");
                GameplayEvents.OnLocalPlayerRequestEscape?.Invoke();
            }
            else
            {
                // [FIX 2]: Sự kiện này bắn ra giờ đây GameManager ĐÃ BIẾT LẮNG NGHE!
                Debug.Log($"<color=red>[Boat] Đứng quá xa ({distance}m)! Bị bỏ lại trên đảo!</color>");
                GameplayEvents.OnPlayerStatusChanged?.Invoke(PhotonNetwork.LocalPlayer.ActorNumber, PlayerMatchStatus.Eliminated);
            }
        }
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.yellow;
        Vector3 center = escapeCenterPoint != null ? escapeCenterPoint.position : transform.position;
        Gizmos.DrawWireSphere(center, escapeRadius);
    }
}