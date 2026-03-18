using Game.Script.UI;
using Game.Scripts.UI.Lobby;
using Photon.Pun;
using UnityEngine;
using UnityEngine.InputSystem;
using VContainer;

public class FPSController : MonoBehaviourPun
{
    [Header("Movement Settings")]
    [SerializeField] private float _moveSpeed = 5f;
    [SerializeField] private float _lookSensitivity = 2f;

    [Header("Internal References")]
    [SerializeField] private Camera _playerCam;

    private InventoryManager _inventoryManager;

    private LobbyUIManager _uiManager;

    // TIÊM ĐÚNG BỘ INPUT TỪ VCONTAINER (Để nhận được phím đã Rebind)
    [Inject] private PlayerInputActions _inputActions;

    private GlobalUIManager _globalUI; // Tự tìm cái này để gọi Menu ESC chung
    private float _verticalRotation = 0f;
    private bool _isLookEnabled = true;
    private bool _isInputBound = false; // Cờ đánh dấu đã bind phím chưa

    #region VContainer Injection

    // Dùng Method Injection thay vì Field Injection. 
    // Hàm này sẽ được _resolver.InjectGameObject() tự động gọi ngay sau khi bơm.
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
    }


    private void OnDisable()
    {
        if (!photonView.IsMine || _inputActions == null) return;

        _inputActions.Player.Disable();

        _inputActions.Player.DropItem.performed -= OnDropItem;
        _inputActions.Player.UseItem.performed -= OnUseItem;
        _inputActions.Player.Esc_Tab.performed -= OnEscapePressed;
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

            // Tự tìm 2 cục UI cần thiết
            _globalUI = FindObjectOfType<Game.Script.UI.GlobalUIManager>();
            BindInventoryUI();

            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
    }

    private void Update()
    {
        if (!photonView.IsMine || _inputActions == null) return;

        if (_globalUI != null && _globalUI.IsEscMenuOpen()) return;

        if (!_isLookEnabled) return;

        HandleMovement();
        HandleRotation();
        HandleInteraction();
    }

    #endregion

    #region Input Callbacks

    private void OnEscapePressed(InputAction.CallbackContext context)
    {
        // GỌI THẲNG GLOBAL UI ĐỂ BẬT MENU ESC XỊN CỦA IN-GAME LÊN
        if (_globalUI != null)
        {
            if (_globalUI.IsEscMenuOpen())
            {
                _globalUI.CloseEscMenu(true);
            }
            else
            {
                _globalUI.OpenEscMenu(Game.Script.UI.GlobalUIManager.EscMenuType.InGame, true);
            }
        }
    }

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

    private void HandleMovement()
    {
        Vector2 moveInput = _inputActions.Player.Move.ReadValue<Vector2>();
        Vector3 direction = transform.right * moveInput.x + transform.forward * moveInput.y;
        transform.position += direction * _moveSpeed * Time.deltaTime;
    }

    private void HandleRotation()
    {
        Vector2 lookInput = _inputActions.Player.Look.ReadValue<Vector2>();
        float mouseX = lookInput.x * _lookSensitivity * Time.deltaTime * 100f;
        float mouseY = lookInput.y * _lookSensitivity * Time.deltaTime * 100f;

        _verticalRotation -= mouseY;
        _verticalRotation = Mathf.Clamp(_verticalRotation, -80f, 80f);

        _playerCam.transform.localRotation = Quaternion.Euler(_verticalRotation, 0f, 0f);
        transform.Rotate(Vector3.up * mouseX);
    }

    private void HandleInteraction()
    {
        if (_inputActions.Player.Interact.triggered)
        {
            // Logic tương tác
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

        _inputActions.Player.Esc_Tab.performed += OnEscapePressed;

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

    #endregion
}