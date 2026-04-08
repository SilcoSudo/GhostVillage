using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;
using Game.Scripts.Gameplay.Core;
using System.Collections;
using Game.Scripts.Core.Game;
using Photon.Voice.PUN; // [FIX CHÍ MẠNG]: Bắt buộc phải có cái này để khóa mõm!

[RequireComponent(typeof(PhotonView))]
public class PlayerKnockedState : MonoBehaviourPun, IInteractable
{
    [Header("Knocked State")]
    public bool isKnocked = false;
    public float maxProgress = 25f;
    [Tooltip("Lượng máu khi vừa bị gục (Để test thì để 10-15, chơi thật để 25)")]
    public float startingProgress = 12.5f;
    public float currentProgress;

    [Header("Physics & Camera Adjustments")]
    [Tooltip("Kéo Camera của Player vào đây")]
    public Transform playerCamera;

    // Đếm số lần bị bắt
    private int _knockCount = 0;

    // Nơi gắn Camera gốc (để biết đường gắn lại khi được cứu)
    private Transform _originalCamParent;
    private Vector3 _originalCamLocalPos;
    private Quaternion _originalCamLocalRot;

    private float drainRate = 25f / 60f;
    private GameManager _gameManager;
    private Animator _animator;
    private int _knockedHash;
    private FPSController _fpsController;

    private CapsuleCollider _capsuleCollider;
    private float _originalCapsuleHeight;
    private float _originalCapsuleCenterY;


    private void Awake()
    {
        _gameManager = UnityEngine.Object.FindFirstObjectByType<GameManager>();
        _animator = GetComponentInChildren<Animator>();
        _knockedHash = Animator.StringToHash("IsKnocked");
        _fpsController = GetComponent<FPSController>();

        if (playerCamera == null) playerCamera = GetComponentInChildren<Camera>().transform;

        if (playerCamera != null)
        {
            _originalCamParent = playerCamera.parent;
            _originalCamLocalPos = playerCamera.localPosition;
            _originalCamLocalRot = playerCamera.localRotation;
        }

        _capsuleCollider = GetComponent<CapsuleCollider>();
        if (_capsuleCollider != null)
        {
            _originalCapsuleHeight = _capsuleCollider.height;
            _originalCapsuleCenterY = _capsuleCollider.center.y;
        }
    }

    private void Start()
    {
        if (photonView.IsMine)
        {
            // 1. Đảm bảo UI luôn được bật lại khi qua màn mới
            var inventoryUI = UnityEngine.Object.FindFirstObjectByType<InventoryUIManager>(FindObjectsInactive.Include);
            if (inventoryUI != null)
            {
                inventoryUI.gameObject.SetActive(true);
            }

            // 2. Trả lại Camera về đúng cái sọ
            if (playerCamera != null)
            {
                playerCamera.SetParent(_originalCamParent);
                playerCamera.localPosition = _originalCamLocalPos;
                playerCamera.localRotation = _originalCamLocalRot;

                // Tiêu diệt cái Hồn (SpectatorController) nếu nó còn dính lẹo
                var spec = playerCamera.GetComponent<SpectatorController>();
                if (spec != null) Destroy(spec);
            }

            // 3. Mở khóa tay chân
            if (_fpsController != null)
            {
                _fpsController.enabled = true;
                _fpsController.SetLookEnabled(true);
            }

            // 4. Bật lại Mesh và Collider (Đề phòng kiếp trước tàng hình)
            SkinnedMeshRenderer[] meshes = GetComponentsInChildren<SkinnedMeshRenderer>(true);
            foreach (var m in meshes) m.enabled = true;

            Collider[] cols = GetComponentsInChildren<Collider>(true);
            foreach (var c in cols) c.enabled = true;

            // Reset đếm số lần chết
            _knockCount = 0;
            isKnocked = false;
        }
    }

    // =========================================================
    // LẮNG NGHE SỰ KIỆN TỪ GAMEMANAGER ĐỂ HÓA KIẾP
    // =========================================================
    // Đăng ký thêm Event lắng nghe GameState để biết lúc nào End Game
    private void OnEnable()
    {
        GameplayEvents.OnPlayerStatusChanged += HandleStatusChanged;
        GameplayEvents.OnGameStateChanged += HandleGameStateChanged; // THÊM DÒNG NÀY
    }

    private void OnDisable()
    {
        GameplayEvents.OnPlayerStatusChanged -= HandleStatusChanged;
        GameplayEvents.OnGameStateChanged -= HandleGameStateChanged; // THÊM DÒNG NÀY
    }

    private void HandleStatusChanged(int actorNum, PlayerMatchStatus status)
    {
        // Chỉ xử lý nếu event gọi đúng tên mình
        if (!photonView.IsMine || photonView.Owner.ActorNumber != actorNum) return;

        if (status == PlayerMatchStatus.Escaped)
        {
            TransformToSpectator(true);
        }
        else if (status == PlayerMatchStatus.Eliminated)
        {
            TransformToSpectator(false);
        }
    }

    // Khi Game Over (Ending), giải phóng chuột cho Hồn để bấm UI Result
    private void HandleGameStateChanged(GameState state)
    {
        if (state == GameState.Ending && photonView.IsMine)
        {
            // Tắt Controller của Hồn (nếu có)
            if (playerCamera != null)
            {
                var spec = playerCamera.GetComponent<SpectatorController>();
                if (spec != null) spec.DeactivateSpectator();
            }

            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
            Debug.Log("<color=cyan>[Spectator] Hết trận! Đã nhả chuột cho Hồn.</color>");
        }
    }

    private void Update()
    {
        if (!isKnocked) return;

        currentProgress -= drainRate * Time.deltaTime;
        currentProgress = Mathf.Max(0, currentProgress);

        if (photonView.IsMine && ReviveQTEManager.Instance != null)
        {
            ReviveQTEManager.Instance.UpdateVictimUI(currentProgress, maxProgress);
        }

        if (photonView.IsMine && currentProgress <= 0)
        {
            currentProgress = 0;
            Die();
        }
    }

    public void GetKnocked()
    {
        if (isKnocked) return;

        _knockCount++; // Tăng số lần bị bắt

        // Kiểm tra nếu chơi solo HOẶC bị bắt lần 2 → Chết luôn
        bool isSoloGame = Photon.Pun.PhotonNetwork.PlayerList.Length == 1;

        if (photonView.IsMine && _gameManager != null)
        {
            if (isSoloGame || _knockCount >= 2)
            {
                Debug.Log($"⚠️ [PlayerKnocked] Lần {_knockCount} bị bắt! Knocked = Eliminated!");

                // Ép nằm sấp xuống trước khi chết hẳn
                photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, true);

                // Báo GameManager khai tử
                _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Eliminated);
                return;
            }
            else
            {
                // Mới bị lần 1: Cho phép revive
                _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Knocked);
            }
        }

        photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, true);
    }

    private void Die()
    {
        Debug.Log($"<color=red>[PlayerKnocked]</color> {photonView.Owner.NickName} ĐÃ CHẾT HẲN DO HẾT MÁU!");
        if (photonView.IsMine && _gameManager != null)
        {
            // Báo tử! Sự kiện OnPlayerStatusChanged sẽ tự động gọi hàm Hóa Kiếp
            _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Eliminated);
        }
    }

    // =========================================================
    // HÓA KIẾP LÀM HỒN (SPECTATOR MODE)
    // =========================================================
    private void TransformToSpectator(bool isEscaped)
    {
        Debug.Log($"<color=magenta>[Spectator] Hóa kiếp làm Hồn! Escaped: {isEscaped}</color>");

        // === [FIX 1]: KHÓA MÕM HỒN LẠI ===
        // Tìm Component Voice gắn trên chính Player này
        var myVoiceView = GetComponent<PhotonVoiceView>();
        if (myVoiceView != null && myVoiceView.RecorderInUse != null)
        {
            myVoiceView.RecorderInUse.TransmitEnabled = false;
            Debug.Log("🔇 [Voice] Đã dán băng keo vào mồm Hồn, cấm phát biểu linh tinh!");
        }

        // === [FIX 2]: ĐÁ BAY UI CỦA NGƯỜI CHẾT/THOÁT ===
        var inventoryUI = UnityEngine.Object.FindFirstObjectByType<InventoryUIManager>();
        if (inventoryUI != null)
        {
            inventoryUI.gameObject.SetActive(false);
        }

        if (playerCamera != null)
        {
            playerCamera.SetParent(null);

            SpectatorController spec = playerCamera.gameObject.GetComponent<SpectatorController>();
            if (spec == null) spec = playerCamera.gameObject.AddComponent<SpectatorController>();
            spec.ActivateSpectator();
        }

        if (_fpsController != null) _fpsController.enabled = false;

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        photonView.RPC(nameof(RpcHandleCorpse), RpcTarget.All, isEscaped);
    }

    [PunRPC]
    private void RpcHandleCorpse(bool isEscaped)
    {
        if (isEscaped)
        {
            // THOÁT THÀNH CÔNG -> Bốc hơi khỏi thế gian
            SkinnedMeshRenderer[] meshes = GetComponentsInChildren<SkinnedMeshRenderer>();
            foreach (var m in meshes)
            {
                if (m.gameObject.name == "Mesh_Player_v3") m.enabled = false;
                else m.enabled = false; // Tắt luôn râu ria quần áo
            }

            Collider[] cols = GetComponentsInChildren<Collider>();
            foreach (var c in cols) c.enabled = false;
        }
        else
        {
            // CHẾT HẲN -> Giữ nguyên cái xác
            isKnocked = true; // Chốt hạ không cho đứng lên
            if (_animator != null)
            {
                _animator.SetBool(_knockedHash, true);
                _animator.SetInteger("ItemType", 0);
                _animator.SetLayerWeight(1, 0f);
            }
        }
    }

    [PunRPC]
    private void RpcSetKnockedState(bool state)
    {
        isKnocked = state;

        if (_animator != null)
        {
            if (state)
            {
                _animator.SetInteger("ItemType", 0);
                _animator.SetLayerWeight(1, 0f);
            }
            else
            {
                _animator.SetLayerWeight(1, 1f);
            }
            _animator.SetBool(_knockedHash, state);
        }

        if (_capsuleCollider != null)
        {
            if (state) // Lúc bị gục
            {
                // Bóp lùn xuống 0.8m. 
                // [FIX]: Hạ trọng tâm Y xuống 0.2 (hoặc 0.1) để nó dán sát mặt đất!
                _capsuleCollider.height = 0.8f;
                _capsuleCollider.center = new Vector3(_capsuleCollider.center.x, 0.2f, _capsuleCollider.center.z);
            }
            else // Lúc đứng lên
            {
                // Trả lại chiều cao và trọng tâm ban đầu (3.8 và 0.9398)
                _capsuleCollider.height = _originalCapsuleHeight;
                _capsuleCollider.center = new Vector3(_capsuleCollider.center.x, _originalCapsuleCenterY, _capsuleCollider.center.z);
            }
        }

        if (photonView.IsMine)
        {
            if (state)
            {
                if (playerCamera != null)
                {
                    playerCamera.SetParent(null);
                    if (_fpsController != null) _fpsController.SetLookEnabled(false);
                    StartCoroutine(CameraFallRoutine());
                }
            }
            else
            {
                if (playerCamera != null)
                {
                    StopAllCoroutines();
                    playerCamera.SetParent(_originalCamParent);
                    playerCamera.localPosition = _originalCamLocalPos;
                    playerCamera.localRotation = _originalCamLocalRot;
                    if (_fpsController != null) _fpsController.SetLookEnabled(true);
                }
            }
        }

        if (state)
        {
            var inventory = GetComponent<InventoryManager>();
            if (inventory != null) inventory.DropAllItemsScattered();
            currentProgress = startingProgress;

            if (photonView.IsMine)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }
        else
        {
            if (photonView.IsMine && ReviveQTEManager.Instance != null) ReviveQTEManager.Instance.HideVictimUI();

            if (photonView.IsMine && currentProgress > 0)
            {
                var inventory = GetComponent<InventoryManager>();
                if (inventory != null) inventory.LockInventory(false);

                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }
    }

    private IEnumerator CameraFallRoutine()
    {
        float duration = 0.5f;
        float elapsed = 0f;

        Vector3 startPos = playerCamera.position;
        Vector3 targetPos = new Vector3(startPos.x, transform.position.y + 0.2f, startPos.z);
        Quaternion startRot = playerCamera.rotation;
        Quaternion targetRot = Quaternion.Euler(0, startRot.eulerAngles.y, 45f);

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;
            float smoothT = t * t * (3f - 2f * t);

            playerCamera.position = Vector3.Lerp(startPos, targetPos, smoothT);
            playerCamera.rotation = Quaternion.Slerp(startRot, targetRot, smoothT);
            yield return null;
        }

        playerCamera.position = targetPos;
        playerCamera.rotation = targetRot;
    }

    public string GetPromptMessage() => "Cứu chữa (F)";

    public void Interact(GameObject actor)
    {
        if (!isKnocked) return;

        var inventory = actor.GetComponent<InventoryManager>();
        if (inventory != null && inventory.items.Count > 0)
        {
            var currentItem = inventory.items[inventory.currentSlotIndex];
            if (currentItem != null && currentItem.itemId == "ITEM_MEDKIT")
            {
                var saviorFPS = actor.GetComponent<FPSController>();
                if (saviorFPS != null) saviorFPS.isPlayingMinigame = true;

                if (ReviveQTEManager.Instance != null)
                {
                    ReviveQTEManager.Instance.StartQTE(this, inventory, saviorFPS);
                }
            }
        }
    }

    [PunRPC]
    public void RpcUpdateReviveProgress(float amount)
    {
        if (!isKnocked) return;

        currentProgress += amount;
        currentProgress = Mathf.Clamp(currentProgress, 0, maxProgress);

        if (currentProgress >= maxProgress)
        {
            photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, false);

            if (photonView.IsMine && _gameManager != null)
            {
                _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Playing);
            }
        }
    }
}