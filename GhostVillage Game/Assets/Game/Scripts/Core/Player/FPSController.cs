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

    private GlobalUIManager _globalUI;
    private float _verticalRotation = 0f;
    private bool _isLookEnabled = true;
    private bool _isInputBound = false;

    private bool _isSprinting = false;
    [HideInInspector] public bool isPlayingMinigame = false;

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

        // MỚI: Hỏi sếp Stats lấy tốc độ. Nếu đang bấm Sprint thì lấy tốc chạy nhanh.
        float currentSpeed = _isSprinting ? _stats.CurrentSprintSpeed : _stats.CurrentMoveSpeed;

        transform.position += direction * currentSpeed * Time.deltaTime;
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

        Debug.Log($"[FPS BindInventoryUI] invUI: {(invUI != null ? "✅" : "❌")}, invManager: {(invManager != null ? "✅" : "❌")}");
        
        if (invUI != null && invManager != null)
        {
            invUI.BindInventory(invManager);
            Debug.Log("✅ [FPS] Đã kết nối túi đồ với UI HUD.");
        }
        else
        {
            if (invUI == null)
                Debug.LogWarning("[FPS] ⚠️ InventoryUIManager không tìm thấy trong scene. Cần thêm nó vào Map_1 hoặc load từ Lobby.");
            if (invManager == null)
                Debug.LogWarning("[FPS] ⚠️ InventoryManager không tìm thấy trên player.");
        }
    }
    #endregion
}