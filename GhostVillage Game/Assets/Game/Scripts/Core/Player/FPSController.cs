using Game.Core.Player.RayCast;
using Game.Script.UI;
using Game.Scripts.UI.Lobby;
using Photon.Pun;
using UnityEngine;
using UnityEngine.InputSystem;
using VContainer;

[RequireComponent(typeof(PlayerStatsManager))] // MỚI: Bắt buộc phải có cục Stats đi kèm
public class FPSController : MonoBehaviourPun
{
    [Header("Internal References")]
    [SerializeField] private Camera _playerCam;

    [Header("Jumpscare Settings")]
    [SerializeField, Range(0f, 0.5f)] private float jumpscareShakeIntensity = 0.05f; // MỚI: Kéo ra Inspector
    [SerializeField] private float jumpscareZoomFOV = 35f;

    private PlayerStatsManager _stats; // MỚI: Sếp quản lý chỉ số
    private InventoryManager _inventoryManager;
    private LobbyUIManager _uiManager;
    private PlayerKnockedState _knockedState;
    private PlayerInteract _playerInteract;

    [Inject] private PlayerInputActions _inputActions;
    private Animator _animator;
    private int _speedHash;

    private GlobalUIManager _globalUI;
    private float _verticalRotation = 0f;
    private bool _isLookEnabled = true;
    private bool _isInputBound = false;
    private bool _isSprinting = false;
    [HideInInspector] public bool isPlayingMinigame = false;

    [Header("True First Person Fix")]
    public Transform headBone; // Nơi nhét cái xương đầu vào

    #region VContainer Injection
    [Inject]
    public void Construct(PlayerInputActions inputActions)
    {
        _inputActions = inputActions;
        BindInputSystem();
    }
    #endregion

    #region LifeCycle

    private void Awake()
    {
        _inventoryManager = GetComponent<InventoryManager>();
        _knockedState = GetComponent<PlayerKnockedState>();
        _stats = GetComponent<PlayerStatsManager>();
        _playerInteract = GetComponent<PlayerInteract>();
        _animator = GetComponentInChildren<Animator>();
        _speedHash = Animator.StringToHash("Speed");
    }

    private void OnDisable()
    {
        if (!photonView.IsMine || _inputActions == null) return;

        _inputActions.Player.Disable();

        _inputActions.Player.DropItem.performed -= OnDropItem;
        _inputActions.Player.UseItem.performed -= OnUseItem;
    }

    [System.Obsolete]
    private void Start()
    {
        if (photonView.IsMine)
        {
            var allListeners = Object.FindObjectsByType<AudioListener>(FindObjectsSortMode.None);
            foreach (var listener in allListeners)
            {
                if (listener.gameObject.transform.root != this.transform)
                    listener.enabled = false;
            }

            _globalUI = FindObjectOfType<Game.Script.UI.GlobalUIManager>();
            _uiManager = FindObjectOfType<LobbyUIManager>();
            BindInventoryUI();

            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
    }

    private void Update()
    {
        if (!photonView.IsMine || _inputActions == null) return;

        if (_globalUI != null && _globalUI.IsEscMenuOpen()) return;

        if (_uiManager != null && _uiManager.IsAnyUIOpen) return;

        if (_knockedState != null && _knockedState.isKnocked) return;

        if (isPlayingMinigame) return;

        if (!_isLookEnabled) return;

        if (_knockedState != null && _knockedState.isKnocked)
        {
            // Báo Animator tốc độ = 0 để blend tree nó im re
            if (_animator != null) _animator.SetFloat(_speedHash, 0f);
            return;
        }

        if (HintModalUI.IsHintOpen) return;

        HandleStateInput();
        HandleMovement();
        HandleRotation();
        HandleInteraction();
    }

    #endregion

    #region Input Callbacks

    private void OnDropItem(InputAction.CallbackContext context)
    {
        if (_inventoryManager != null) _inventoryManager.DropCurrentItem();
    }

    private void OnUseItem(InputAction.CallbackContext context)
    {
        if (_inventoryManager != null) _inventoryManager.UseCurrentItem();
    }
    #endregion

    #region Logic Handlers

    private void HandleStateInput()
    {
        bool isSprintPressed = _inputActions.Player.Sprint.IsPressed();

        if (isSprintPressed)
        {
            Vector2 moveInput = _inputActions.Player.Move.ReadValue<Vector2>();
            bool isMoving = moveInput.magnitude > 0.1f;

            // [MỚI]: Truyền _isSprinting vào để nó biết là đang chạy hay mới bấm
            if (isMoving && _stats.CanSprint(_isSprinting))
            {
                _isSprinting = true;
                _stats.DrainStaminaForSprint();
            }
            else
            {
                // [LƯỚI BẢO VỆ]: Nếu đang chạy mà hết sạch máu bị ép dừng -> Gắn cờ mệt mỏi
                if (_isSprinting)
                {
                    _stats.StopSprinting();
                }
                _isSprinting = false;
            }
        }
        else
        {
            // Nhả phím ra
            if (_isSprinting)
            {
                _stats.StopSprinting();
            }
            _isSprinting = false;
        }
    }
    private void HandleMovement()
    {
        Vector2 moveInput = _inputActions.Player.Move.ReadValue<Vector2>();
        Vector3 direction = transform.right * moveInput.x + transform.forward * moveInput.y;

        // 1. DI CHUYỂN VẬT LÝ (Code cũ của sếp)
        float currentSpeed = _isSprinting ? _stats.CurrentSprintSpeed : _stats.CurrentMoveSpeed;
        transform.position += direction * currentSpeed * Time.deltaTime;

        // ==========================================
        // 2. KHÚC NÀY BỊ THIẾU NÈ: TRUYỀN TỐC ĐỘ CHO ANIMATOR
        // ==========================================
        if (_animator != null)
        {
            float targetAnimSpeed = 0f;
            if (moveInput.magnitude > 0.1f)
            {
                targetAnimSpeed = _isSprinting ? 1.5f : 1f; // Khớp với Threshold của sếp
            }

            // [QUAN TRỌNG]: Không dùng IsMine ở đây để máy khác cũng tính toán được Speed nếu sếp chưa gắn PhotonAnimatorView
            _animator.SetFloat(_speedHash, targetAnimSpeed);
        }
    }

    private void HandleRotation()
    {
        Vector2 lookInput = _inputActions.Player.Look.ReadValue<Vector2>();

        // MỚI: Hỏi sếp Stats lấy độ nhạy chuột
        float currentSensitivity = _stats.lookSensitivity;

        float mouseX = lookInput.x * currentSensitivity * Time.deltaTime * 100f;
        float mouseY = lookInput.y * currentSensitivity * Time.deltaTime * 100f;

        _verticalRotation -= mouseY;
        _verticalRotation = Mathf.Clamp(_verticalRotation, -80f, 80f);

        _playerCam.transform.localRotation = Quaternion.Euler(_verticalRotation, 0f, 0f);
        transform.Rotate(Vector3.up * mouseX);
    }

    private void HandleInteraction()
    {
        // MỚI: Bắt nút Interact (F) từ InputSystem và ra lệnh cho PlayerInteract
        if (_inputActions.Player.Interact.triggered)
        {
            if (_playerInteract != null)
            {
                _playerInteract.TryInteract();
            }
        }
    }

    #endregion

    #region Input Setup
    private void BindInputSystem()
    {
        if (!photonView.IsMine || _inputActions == null || _isInputBound) return;

        _inputActions.Player.Enable();

        _inputActions.Player.DropItem.performed += OnDropItem;
        _inputActions.Player.UseItem.performed += OnUseItem;

        _inputActions.Player.Item_Slot1.performed += ctx => _inventoryManager.SelectSlot(0);
        _inputActions.Player.Item_Slot2.performed += ctx => _inventoryManager.SelectSlot(1);
        _inputActions.Player.Item_Slot3.performed += ctx => _inventoryManager.SelectSlot(2);

        _isInputBound = true;
        Debug.Log("🎮 [FPSController] Đã Bind thành công InputSystem từ VContainer!");
    }
    #endregion

    #region Public Helpers
    public void SetLookEnabled(bool isEnabled) => _isLookEnabled = isEnabled;

    private void BindInventoryUI()
    {
        var invUI = Object.FindFirstObjectByType<InventoryUIManager>();
        var invManager = GetComponent<InventoryManager>();

        Debug.Log($"[FPS BindInventoryUI] invUI: {(invUI != null ? "" : "")}, invManager: {(invManager != null ? "" : "")}");

        if (invUI != null && invManager != null)
        {
            invUI.BindInventory(invManager);
            Debug.Log(" [FPS] Đã kết nối túi đồ với UI HUD.");
        }
        else
        {
            if (invUI == null)
                Debug.LogWarning("[FPS] ⚠️ InventoryUIManager không tìm thấy trong scene. Cần thêm nó vào Map_1 hoặc load từ Lobby.");
            if (invManager == null)
                Debug.LogWarning("[FPS] ⚠️ InventoryManager không tìm thấy trên player.");
        }
    }

    #region JUMPSCARE CAMERA EFFECT
    [PunRPC]
    public void ReceiveJumpscareRPC(int monsterViewID)
    {
        // Nhận lệnh từ Master, nếu đây đúng là máy của nạn nhân thì mới khóa Cam
        if (photonView.IsMine)
        {
            PhotonView monsterPv = PhotonView.Find(monsterViewID);
            if (monsterPv != null)
            {
                StartCoroutine(JumpscareCameraRoutine(monsterPv.transform));
            }
        }
    }

    private System.Collections.IEnumerator JumpscareCameraRoutine(Transform monsterTrans)
    {
        // 1. KHÓA TỨ CHI & INPUT CỦA NGƯỜI CHƠI
        isPlayingMinigame = true; // Khóa logic Update
        SetLookEnabled(false);    // Khóa xoay chuột
        _isSprinting = false;

        // Ép nhân vật đứng im
        if (_animator != null) _animator.SetFloat(_speedHash, 0f);

        // 2. ĐỊNH VỊ MẶT QUÁI (Cao lên khoảng 1.5m so với tâm quái)
        Vector3 monsterFacePos = monsterTrans.position + Vector3.up * 1.5f;

        float timer = 0f;
        float duration = 2.5f; // Khớp với JumpscareDuration bên quái
        float originalFOV = _playerCam.fieldOfView;
        float targetFOV = 35f; // Zoom giật thót vào mặt

        Quaternion startCamRot = _playerCam.transform.rotation;
        Vector3 originalCamLocalPos = _playerCam.transform.localPosition;

        while (timer < duration)
        {
            timer += Time.deltaTime;

            // Xoay Cam từ từ (Slerp) thẳng vào mắt Ma Da (trong 0.3s đầu để tạo độ mượt)
            Vector3 dirToFace = monsterFacePos - _playerCam.transform.position;
            Quaternion targetRot = Quaternion.LookRotation(dirToFace);
            _playerCam.transform.rotation = Quaternion.Slerp(startCamRot, targetRot, timer / 0.3f);

            // Zoom FOV
            _playerCam.fieldOfView = Mathf.Lerp(originalFOV, targetFOV, timer / 0.3f);

            // Camera Shake (Rung bần bật)
            if (timer > 0.2f && jumpscareShakeIntensity > 0f)
            {
                float xShake = (Mathf.PerlinNoise(timer * 20f, 0f) - 0.5f) * jumpscareShakeIntensity;
                float yShake = (Mathf.PerlinNoise(0f, timer * 20f) - 0.5f) * jumpscareShakeIntensity;
                _playerCam.transform.localPosition = originalCamLocalPos + new Vector3(xShake, yShake, 0f);
            }

            yield return null;
        }

        // HẾT JUMPSCARE -> MÀN HÌNH ĐEN HOẶC BÁO CHẾT
        _playerCam.transform.localPosition = originalCamLocalPos; // Reset chống lệch
        _playerCam.fieldOfView = originalFOV;

        isPlayingMinigame = false;

        // [KẾT LIỄU]: Gọi thẳng hàm Knock của sếp
        if (_knockedState != null)
        {
            Debug.Log("<color=red>[Jumpscare]</color> Hù xong! Bắt đầu đánh gục Player!");

            // [FIX CHÍ MẠNG]: CHỈ CÁI THẰNG BỊ HÙ (CHỦ XÁC) MỚI ĐƯỢC PHÉP BẤM NÚT "TỰ TỬ"
            if (photonView.IsMine)
            {
                _knockedState.GetKnocked();
            }
        }
    }
    #endregion

    private void LateUpdate()
    {
        // CHỈ TEO ĐẦU Ở MÁY CỦA MÌNH. Máy người khác vẫn thấy đầu mình.
        if (photonView.IsMine && headBone != null)
        {
            // Ép scale của xương đầu về 0. (Các xương con như mắt, tóc cũng sẽ teo theo)
            headBone.localScale = Vector3.zero;
        }
    }

    #endregion
}