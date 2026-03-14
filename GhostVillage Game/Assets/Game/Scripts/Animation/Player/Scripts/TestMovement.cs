using UnityEngine;
using UnityEngine.InputSystem;
using System.Collections;

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
                StartCoroutine(ReviveRoutine()); 
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
        // Kiểm tra nếu đụng trúng Monster và mình chưa chết
        if (collision.gameObject.CompareTag("TestMonster") && !_isDead)
        {
            // --- CÁCH 2: ĐUỔI CÁI CUBE ĐI CHỖ KHÁC ---
            
            // 1. Tính toán hướng từ bạn đến cái Cube
            Vector3 pushDir = (collision.transform.position - transform.position).normalized;
            
            // 2. Ép hướng đẩy chỉ nằm ngang (để nó không bị bay lên trời hoặc lún xuống đất)
            pushDir.y = 0;

            // 3. Dịch chuyển cái Cube ra xa 4 mét ngay lập tức
            collision.transform.position += pushDir * 4f;

            // 4. Gọi hàm chết để diễn animation
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

        animator.SetTrigger(DieHash);
        Debug.Log("💀 ĐÃ CHẾT! Bấm F để đứng dậy.");
    }

    private IEnumerator ReviveRoutine()
    {
        _isDead = false; 
        animator.SetTrigger(GetUpHash);

        // 1. Lưu lại vị trí CHÍNH XÁC lúc bạn đang nằm
        Vector3 startPosition = transform.position;

        int playerLayer = LayerMask.NameToLayer("TestPlayer");
        int monsterLayer = LayerMask.NameToLayer("TestMonster");
        Physics.IgnoreLayerCollision(playerLayer, monsterLayer, true);

        // 2. Chạy một vòng lặp trong 2 giây (thời gian đứng dậy)
        float duration = 2.0f; 
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            
            // Ép vị trí X và Z không được thay đổi, chỉ cho phép animation diễn hoạt
            // Điều này triệt tiêu hoàn toàn việc bị lệch trái/phải/trước/sau
            transform.position = new Vector3(startPosition.x, transform.position.y, startPosition.z);
            
            yield return null;
        }

        if (_rb != null) 
        {
            _rb.isKinematic = false;
            _rb.linearVelocity = Vector3.zero;
        }

        Physics.IgnoreLayerCollision(playerLayer, monsterLayer, false);
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