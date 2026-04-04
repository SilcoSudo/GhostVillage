using UnityEngine;
using Photon.Pun;
using Game.Core.Player.RayCast;
using Game.Scripts.Gameplay.Core;
using System.Collections; // Thêm thư viện này để dùng Coroutine

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

    // Nơi gắn Camera gốc (để biết đường gắn lại khi được cứu)
    private Transform _originalCamParent;
    private Vector3 _originalCamLocalPos;
    private Quaternion _originalCamLocalRot;

    private float drainRate = 25f / 60f;
    private GameManager _gameManager;
    private Animator _animator;
    private int _knockedHash;
    private FPSController _fpsController; // MỚI: Gọi FPS Controller để khóa góc nhìn

    private void Awake()
    {
        _gameManager = UnityEngine.Object.FindFirstObjectByType<GameManager>();
        _animator = GetComponentInChildren<Animator>();
        _knockedHash = Animator.StringToHash("IsKnocked");
        _fpsController = GetComponent<FPSController>();

        // Tự động tìm Camera nếu sếp quên kéo vào Inspector
        if (playerCamera == null) playerCamera = GetComponentInChildren<Camera>().transform;

        // Lưu trữ lại vị trí Camera chuẩn để sau khi cứu còn gắn lại được
        if (playerCamera != null)
        {
            _originalCamParent = playerCamera.parent;
            _originalCamLocalPos = playerCamera.localPosition;
            _originalCamLocalRot = playerCamera.localRotation;
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

        if (photonView.IsMine && _gameManager != null)
        {
            _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Knocked);
        }

        photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, true);
    }

    [PunRPC]
    private void RpcSetKnockedState(bool state)
    {
        isKnocked = state;

        // Xử lý Animation
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

        // ==========================================
        // XỬ LÝ CAMERA KHI GỤC / ĐỨNG DẬY (KHÔNG CHẠM VÀO COLLIDER)
        // ==========================================
        if (photonView.IsMine) // Chỉ xử lý Camera trên máy của chính nạn nhân
        {
            if (state)
            {
                // Khi Gục: Rút Camera ra khỏi người, rớt nó xuống đất
                if (playerCamera != null)
                {
                    // Tách Camera ra khỏi Player để nó không bị rung lắc theo animation
                    playerCamera.SetParent(null);

                    // Khóa không cho FPSController xoay Camera nữa
                    if (_fpsController != null) _fpsController.SetLookEnabled(false);

                    // Chạy hiệu ứng Camera té ngã (rơi xuống đất và nghiêng qua 1 bên)
                    StartCoroutine(CameraFallRoutine());
                }
            }
            else
            {
                // Khi Cứu Sống: Gắn Camera lại vào đầu
                if (playerCamera != null)
                {
                    StopAllCoroutines(); // Dừng hiệu ứng té nếu đang chạy

                    // Trả Camera về đúng chỗ cũ
                    playerCamera.SetParent(_originalCamParent);
                    playerCamera.localPosition = _originalCamLocalPos;
                    playerCamera.localRotation = _originalCamLocalRot;

                    // Mở lại quyền xoay chuột
                    if (_fpsController != null) _fpsController.SetLookEnabled(true);
                }
            }
        }

        // Xử lý UI và Khóa chuột
        if (state)
        {
            var inventory = GetComponent<InventoryManager>();
            if (inventory != null) inventory.DropAllItemsScattered();

            currentProgress = startingProgress;
            Debug.Log($"<color=orange>[PlayerKnocked]</color> {photonView.Owner.NickName} đã bị Knocked!");

            if (photonView.IsMine)
            {
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }
        }
        else
        {
            if (photonView.IsMine && ReviveQTEManager.Instance != null)
            {
                ReviveQTEManager.Instance.HideVictimUI();
            }

            if (photonView.IsMine && currentProgress > 0)
            {
                var inventory = GetComponent<InventoryManager>();
                if (inventory != null) inventory.LockInventory(false);

                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }
    }

    // Hiệu ứng Camera rớt bịch xuống đất và nghiêng sang 1 bên
    private IEnumerator CameraFallRoutine()
    {
        float duration = 0.5f; // Rớt mất nửa giây
        float elapsed = 0f;

        Vector3 startPos = playerCamera.position;
        // Điểm rơi: Giữ nguyên X, Z. Rơi xuống Y = Tọa độ gót chân + 0.2f (để không lún mặt xuống sàn)
        Vector3 targetPos = new Vector3(startPos.x, transform.position.y + 0.2f, startPos.z);

        Quaternion startRot = playerCamera.rotation;
        // Xoay Camera hơi nghiêng qua phải (hoặc trái) để giống đang nằm nghiêng đầu
        Quaternion targetRot = Quaternion.Euler(0, startRot.eulerAngles.y, 45f);

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;
            // Dùng AnimationCurve đơn giản (SmoothStep) để rơi mượt hơn
            float smoothT = t * t * (3f - 2f * t);

            playerCamera.position = Vector3.Lerp(startPos, targetPos, smoothT);
            playerCamera.rotation = Quaternion.Slerp(startRot, targetRot, smoothT);

            yield return null;
        }

        playerCamera.position = targetPos;
        playerCamera.rotation = targetRot;
    }

    private void Die()
    {
        if (photonView.IsMine && _gameManager != null)
        {
            _gameManager.ReportStatusChange(photonView.Owner.ActorNumber, PlayerMatchStatus.Eliminated);
        }

        photonView.RPC(nameof(RpcSetKnockedState), RpcTarget.All, false);
        Debug.Log($"<color=red>[PlayerKnocked]</color> {photonView.Owner.NickName} ĐÃ CHẾT HẲN!");

        if (photonView.IsMine)
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }
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
                Debug.Log("<color=cyan>[PlayerKnocked]</color> Bồ đang cầm Medkit. Bắt đầu QTE!");

                var saviorFPS = actor.GetComponent<FPSController>();
                if (saviorFPS != null) saviorFPS.isPlayingMinigame = true;

                if (ReviveQTEManager.Instance != null)
                {
                    ReviveQTEManager.Instance.StartQTE(this, inventory, saviorFPS);
                }
            }
            else
            {
                Debug.Log("<color=yellow>[PlayerKnocked]</color> Lấy Hộp Cứu Thương ra cầm đi!");
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