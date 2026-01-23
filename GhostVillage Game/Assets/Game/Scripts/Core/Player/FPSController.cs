using Game.Scripts.UI.Lobby;
using Photon.Pun;
using UnityEngine;
using UnityEngine.InputSystem;
using VContainer;

/// <summary>
/// Điều khiển di chuyển, góc nhìn và tương tác vật lý của người chơi trong không gian 3D.
/// Hỗ trợ đồng bộ mạng qua Photon và quản lý trạng thái qua VContainer.
/// </summary>
public class FPSController : MonoBehaviourPun
{
    [Header("Movement Settings")]
    [SerializeField] private float _moveSpeed = 5f;
    [SerializeField] private float _lookSensitivity = 2f;

    [Header("Internal References")]
    [SerializeField] private Camera _playerCam;

    [Inject] private LobbyUIManager _uiManager;

    private PlayerInputActions _inputActions;
    private float _verticalRotation = 0f;
    private bool _isLookEnabled = true;

    #region LifeCycle

    private void Awake()
    {
        _inputActions = new PlayerInputActions();
    }

    private void OnEnable()
    {
        _inputActions.Player.Enable();
    }

    private void OnDisable()
    {
        _inputActions.Player.Disable();
    }

    private void Start()
    {
        // 1. Kiểm tra quyền sở hữu (Multiplayer)
        if (!photonView.IsMine)
        {
            if (_playerCam != null) _playerCam.gameObject.SetActive(false);
            enabled = false;
            return;
        }

        // 2. Thiết lập trạng thái chuột ban đầu
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        // 3. Khởi tạo liên kết Inventory UI (Nếu có)
        BindInventoryUI();
    }

    private void Update()
    {
        if (!photonView.IsMine) return;

        // TƯ DUY KỸ: Chặn toàn bộ Input nếu bất kỳ UI nào đang mở hoặc đang gõ Chat
        if (_uiManager != null && _uiManager.IsAnyUIOpen) return;

        // Chặn góc nhìn nếu flag thủ công được set
        if (!_isLookEnabled) return;

        HandleMovement();
        HandleRotation();
        HandleInteraction();
    }

    #endregion

    #region Logic Handlers

    /// <summary> Xử lý di chuyển bằng WASD dựa trên hướng của Camera. </summary>
    private void HandleMovement()
    {
        Vector2 moveInput = _inputActions.Player.Move.ReadValue<Vector2>();
        Vector3 direction = transform.right * moveInput.x + transform.forward * moveInput.y;
        transform.position += direction * _moveSpeed * Time.deltaTime;
    }

    /// <summary> Xử lý xoay Camera theo chuột và kẹp góc nhìn dọc (Clamp). </summary>
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

    /// <summary> Lắng nghe phím F để thực hiện các hành động tương tác. </summary>
    private void HandleInteraction()
    {
        if (_inputActions.Player.Interact.triggered)
        {
            Debug.Log("[FPS] Interact Key Pressed.");
            // Lưu ý: Logic Raycast chi tiết nên nằm ở script PlayerInteract riêng biệt để module hóa
        }
    }

    #endregion

    #region Public Helpers

    /// <summary> Bật hoặc tắt khả năng xoay camera (gọi từ UI hoặc các sự kiện Cutscene). </summary>
    public void SetLookEnabled(bool isEnabled) => _isLookEnabled = isEnabled;

    /// <summary> Tìm và liên kết dữ liệu túi đồ của người chơi cục bộ với UI. </summary>
    private void BindInventoryUI()
    {
        var invUI = Object.FindFirstObjectByType<InventoryUIManager>();
        var invManager = GetComponent<InventoryManager>();

        if (invUI != null && invManager != null)
        {
            invUI.BindInventory(invManager);
            Debug.Log($"[FPS] Bound inventory of {gameObject.name} to UI.");
        }
    }

    #endregion
}