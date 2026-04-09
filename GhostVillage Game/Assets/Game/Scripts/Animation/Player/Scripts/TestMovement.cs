using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections;
using UnityEngine.Rendering;
using Game.Core.Player.RayCast;

public class TestMovement : MonoBehaviour
{
    public enum MovementState { Idle, Walking, Running, Dead }

    [Header("References")]
    public Camera playerCam; 
    public Animator animator;

    [Header("Settings")]
    public float walkSpeed = 3f;  
    public float runSpeed = 6f;   
    public float lookSensitivity = 15f;

    [Header("First Person View")]
    public bool hideLocalBody = true;
    public bool keepBodyShadows = true;
    public bool stabilizeCamera = true;
    public float cameraHeight = 1.62f;
    public float cameraForwardOffset = 0.32f;
    public float cameraSmoothSpeed = 16f;

    private PlayerInputActions _inputActions;
    private Rigidbody _rb;
    private CapsuleCollider _col; // Thêm collider để tắt/mở
    private PlayerInteract _playerInteract;
    private float _verticalRotation = 0f;
    private MovementState _currentState = MovementState.Idle;
    private bool _isDead = false;
    private Renderer[] _bodyRenderers;

    private readonly int SpeedHash = Animator.StringToHash("Speed");
    private readonly int DieHash = Animator.StringToHash("Die");
    private readonly int GetUpHash = Animator.StringToHash("GetUp");

    private void Awake()
    {
        _inputActions = new PlayerInputActions();
        _rb = GetComponent<Rigidbody>();
        _col = GetComponent<CapsuleCollider>();
        _playerInteract = GetComponent<PlayerInteract>();
        _bodyRenderers = GetComponentsInChildren<Renderer>(true);
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;

        if (hideLocalBody)
        {
            ApplyBodyRenderMode();
        }
    }

    private void OnEnable() => _inputActions.Player.Enable();
    private void OnDisable() => _inputActions.Player.Disable();

    private void Update()
    {
        if (_isDead)
        {
            if (Keyboard.current.fKey.wasPressedThisFrame)
            {
                StartCoroutine(ReviveRoutine()); 
            }
            return; 
        }

        HandleRotation();
        HandleMovement();
        HandleInteraction();
        HandleAnimation();
    }

    private void HandleInteraction()
    {
        if (_playerInteract == null) return;

        if (_inputActions.Player.Interact.triggered)
        {
            _playerInteract.TryInteract();
        }
    }

    private void LateUpdate()
    {
        if (!stabilizeCamera || playerCam == null) return;

        Vector3 targetPos = transform.position
                            + Vector3.up * cameraHeight
                            + transform.forward * cameraForwardOffset;

        playerCam.transform.position = Vector3.Lerp(
            playerCam.transform.position,
            targetPos,
            cameraSmoothSpeed * Time.deltaTime);
    }

    private void HandleMovement()
    {
        Vector2 moveInput = _inputActions.Player.Move.ReadValue<Vector2>();
        bool isSprinting = _inputActions.Player.Sprint.IsPressed(); 

        if (moveInput.sqrMagnitude > 0.01f)
            _currentState = isSprinting ? MovementState.Running : MovementState.Walking;
        else
            _currentState = MovementState.Idle;

        float currentSpeed = (_currentState == MovementState.Running) ? runSpeed : walkSpeed;
        Vector3 direction = transform.right * moveInput.x + transform.forward * moveInput.y;
        transform.position += direction * currentSpeed * Time.deltaTime;
    }

    private void OnCollisionEnter(Collision collision)
    {
        if (collision.gameObject.CompareTag("TestMonster") && !_isDead)
        {
            Vector3 pushDir = (collision.transform.position - transform.position).normalized;
            pushDir.y = 0;
            collision.transform.position += pushDir * 4f;

            Die();
            Debug.Log("💥 Đã đẩy quái ra xa để lấy chỗ diễn Dying!");
        }
    }

    private void Die()
    {
        _isDead = true;
        _currentState = MovementState.Dead;
        
        if (_rb != null)
        {
            _rb.linearVelocity = Vector3.zero;
            _rb.angularVelocity = Vector3.zero;
            _rb.isKinematic = true; 
        }

        // 1. TẮT COLLIDER: Trị dứt điểm lỗi "thụt xuống đất"
        if (_col != null) _col.enabled = false;

        animator.SetTrigger(DieHash);
        Debug.Log("💀 ĐÃ CHẾT! Bấm F để đứng dậy.");
    }

    private IEnumerator ReviveRoutine()
    {
        _isDead = false; 

        // 1. Kích hoạt animation đứng dậy
        animator.SetTrigger(GetUpHash);

        // 2. Tạm thời tắt vật lý để animation diễn ra mượt (không bị lún sàn do va chạm)
        if (_rb != null) _rb.isKinematic = true;
        if (_col != null) _col.enabled = false;

        // 3. Đợi cho đến khi đứng dậy xong (ví dụ clip dài 2 giây)
        yield return new WaitForSeconds(2.0f);

        // 4. Bật lại mọi thứ để chơi tiếp
        if (_rb != null) 
        {
            _rb.isKinematic = false;
            _rb.linearVelocity = Vector3.zero;
        }
        if (_col != null) _col.enabled = true;

        Debug.Log("🛡️ Đã đứng dậy xong!");
    }

    private void HandleRotation()
    {
        Vector2 lookInput = _inputActions.Player.Look.ReadValue<Vector2>();
        _verticalRotation -= lookInput.y * lookSensitivity * Time.deltaTime;
        _verticalRotation = Mathf.Clamp(_verticalRotation, -80f, 80f);
        playerCam.transform.localRotation = Quaternion.Euler(_verticalRotation, 0f, 0f);
        transform.Rotate(Vector3.up * lookInput.x * lookSensitivity * Time.deltaTime);
    }

    private void HandleAnimation()
    {
        if (animator == null || _isDead) return;
        float target = (_currentState == MovementState.Walking) ? 1f : (_currentState == MovementState.Running ? 2f : 0f);
        animator.SetFloat(SpeedHash, target, 0.1f, Time.deltaTime);
    }

    private void ApplyBodyRenderMode()
    {
        if (_bodyRenderers == null) return;

        for (int i = 0; i < _bodyRenderers.Length; i++)
        {
            Renderer r = _bodyRenderers[i];
            if (r == null) continue;

            // Never hide camera helpers or UI under camera
            if (playerCam != null && r.transform.IsChildOf(playerCam.transform))
                continue;

            if (keepBodyShadows)
            {
                r.shadowCastingMode = ShadowCastingMode.ShadowsOnly;
                r.enabled = true;
            }
            else
            {
                r.enabled = false;
            }
        }
    }
}