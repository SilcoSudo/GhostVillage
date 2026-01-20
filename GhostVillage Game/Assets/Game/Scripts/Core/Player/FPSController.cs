using Photon.Pun;
using UnityEngine;
using UnityEngine.InputSystem; // Import Input System

public class FPSController : MonoBehaviourPun
{
    public float speed = 5f;
    public float sensitivity = 2f;

    private Camera playerCam;
    private float rotX = 0f;

    private PlayerInputActions inputActions;
    private bool canLook = true;   // <-- Thêm flag

    void Awake()
    {
        inputActions = new PlayerInputActions();
    }

    void OnEnable()
    {
        inputActions.Player.Enable();
    }

    void OnDisable()
    {
        inputActions.Player.Disable();
    }

    void Start()
    {
        if (!photonView.IsMine)
        {
            enabled = false;
            return;
        }

        playerCam = GetComponentInChildren<Camera>();
        Cursor.lockState = CursorLockMode.Locked;

        // === BIND INVENTORY UI ===
        var uiManager = FindFirstObjectByType<InventoryUIManager>();
        if (uiManager != null)
        {
            var inv = GetComponent<InventoryManager>();
            if (inv != null)
            {
                uiManager.BindInventory(inv);
                Debug.Log($"[FPSController] Bound local player inventory to UI ({inv.gameObject.name})");
            }
            else
            {
                Debug.LogWarning("[FPSController] Player không có InventoryManager!");
            }
        }
        else
        {
            Debug.LogWarning("[FPSController] Không tìm thấy InventoryUIManager trong scene!");
        }
    }



    void Update()
    {
        if (!photonView.IsMine) return;

        // === Di chuyển (WASD) ===
        Vector2 moveInput = inputActions.Player.Move.ReadValue<Vector2>();
        Vector3 move = transform.right * moveInput.x + transform.forward * moveInput.y;
        transform.position += move * speed * Time.deltaTime;

        // === Xoay chuột ===
        Vector2 lookInput = inputActions.Player.Look.ReadValue<Vector2>();
        float mouseX = lookInput.x * sensitivity * Time.deltaTime * 100f;
        float mouseY = lookInput.y * sensitivity * Time.deltaTime * 100f;

        rotX -= mouseY;
        rotX = Mathf.Clamp(rotX, -80f, 80f);

        playerCam.transform.localRotation = Quaternion.Euler(rotX, 0f, 0f);
        transform.Rotate(Vector3.up * mouseX);

        // === Tương tác (F) ===
        if (inputActions.Player.Interact.triggered)
        {
            Debug.Log("Interact pressed!");
            // TODO: gọi hàm tương tác sau này
        }
    }

    // Gọi từ UI
    public void SetLookEnabled(bool enabled)
    {
        canLook = enabled;
    }
}
