using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections; // Cần dòng này để xài Coroutine

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

    private PlayerInputActions _inputActions;
    private Rigidbody _rb;
    private float _verticalRotation = 0f;
    private MovementState _currentState = MovementState.Idle;
    private bool _isDead = false;

    private readonly int SpeedHash = Animator.StringToHash("Speed");
    private readonly int DieHash = Animator.StringToHash("Die");
    private readonly int GetUpHash = Animator.StringToHash("GetUp");

    private void Awake()
    {
        _inputActions = new PlayerInputActions();
        _rb = GetComponent<Rigidbody>();
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    private void OnEnable() => _inputActions.Player.Enable();
    private void OnDisable() => _inputActions.Player.Disable();

    private void Update()
    {
        if (_isDead)
        {
            if (Keyboard.current.fKey.wasPressedThisFrame)
            {
                StartCoroutine(ReviveRoutine()); // Dùng Coroutine để hồi sinh từ từ
            }
            return; 
        }

        HandleRotation();
        HandleMovement();
        HandleAnimation();
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
            Die();
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

        animator.SetTrigger(DieHash);
        Debug.Log("💀 ĐÃ CHẾT! Bấm F để đứng dậy.");
    }

    // COROUTINE HỒI SINH AN TOÀN
    private IEnumerator ReviveRoutine()
    {
        _isDead = false; // Mở khóa logic trước
        animator.SetTrigger(GetUpHash);

        // 1. Nhích nhân vật ra sau 0.5m để tránh dính vào quái/vật cản gây bay
        transform.position -= transform.forward * 0.5f;

        // 2. Chờ một khoảng thời gian ngắn (ví dụ 1.5 giây) cho animation đứng dậy diễn ra
        yield return new WaitForSeconds(1.5f);

        // 3. Lúc này mới bật lại vật lý
        if (_rb != null) 
        {
            _rb.isKinematic = false;
            _rb.linearVelocity = Vector3.zero; // Reset vận tốc lần nữa cho chắc
        }
        
        Debug.Log("🛡️ ĐÃ HỒI SINH AN TOÀN!");
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
}