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
        // MỚI: Đọc Input chạy nhanh. (Bro nhớ cài nút Sprint trong Input Actions nhé)
        _isSprinting = _inputActions.Player.Sprint.IsPressed();
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
        if (_animator != null && photonView.IsMine)
        {
            float targetAnimSpeed = 0f;

            // Kiểm tra xem người chơi có đang bấm nút di chuyển (WASD) không
            if (moveInput.magnitude > 0.1f)
            {
                // Dựa theo Blend Tree của sếp: Walk ngưỡng là 0.5, Run ngưỡng là 1
                targetAnimSpeed = _isSprinting ? 1f : 0.5f;
            }

            // Dùng Mathf.Lerp để animation chuyển từ từ (Đứng -> Đi -> Chạy) cho nó mượt, không bị giật cục
            float currentAnimSpeed = _animator.GetFloat(_speedHash);
            _animator.SetFloat(_speedHash, Mathf.Lerp(currentAnimSpeed, targetAnimSpeed, Time.deltaTime * 10f));
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

        if (invUI != null && invManager != null)
        {
            invUI.BindInventory(invManager);
            Debug.Log("✅ [FPS] Đã kết nối túi đồ với UI HUD.");
        }
    }

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