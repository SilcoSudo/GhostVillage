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

    [Inject] private LobbyUIManager _uiManager;

    private PlayerInputActions _inputActions;
    private float _verticalRotation = 0f;
    private bool _isLookEnabled = true;

    #region LifeCycle

    private void Awake()
    {
        _inputActions = new PlayerInputActions();
        _inventoryManager = GetComponent<InventoryManager>();
    }

    private void OnEnable()
    {
        if (!photonView.IsMine) return;

        _inputActions.Player.Enable();

        // 1. Drop Item (Q)
        _inputActions.Player.DropItem.performed += OnDropItem;

        // 2. Use Item (E)
        _inputActions.Player.UseItem.performed += OnUseItem;

        // 3. Slot Input (1, 2, 3) - Dùng 3 Action riêng biệt cho rõ ràng
        // Đảm bảo trong Input Asset bạn đã tạo 3 Action: Item_Slot1 (Key 1), Item_Slot2 (Key 2), Item_Slot3 (Key 3)
        _inputActions.Player.Item_Slot1.performed += ctx => _inventoryManager.SelectSlot(0);
        _inputActions.Player.Item_Slot2.performed += ctx => _inventoryManager.SelectSlot(1);
        _inputActions.Player.Item_Slot3.performed += ctx => _inventoryManager.SelectSlot(2);

        // ĐÃ XÓA DÒNG GÂY LỖI: _inputActions.Player.InventorySlot...
    }

    private void OnDisable()
    {
        if (!photonView.IsMine) return;

        _inputActions.Player.Disable();

        _inputActions.Player.DropItem.performed -= OnDropItem;
        _inputActions.Player.UseItem.performed -= OnUseItem;
    }

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
        }

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        BindInventoryUI();
    }

    private void Update()
    {
        if (!photonView.IsMine) return;

        if (_uiManager != null && _uiManager.IsAnyUIOpen) return;

        if (!_isLookEnabled) return;

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