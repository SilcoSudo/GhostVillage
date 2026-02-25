using UnityEngine;
using GhostVillage.Gameplay.Base;
using GhostVillage.Gameplay.Shared;
using UnityEngine.InputSystem;

namespace GhostVillage.Gameplay.Monsters.OngKe
{
    /// <summary>
    /// Ông Kẹ - Boss quái quái Map 1
    /// Đặc điểm: Patrol vòng vòng trên map
    /// </summary>
    public class OngKeMonster : MonsterBase
    {
        [Header("--- OngKe Specific ---")]
        [SerializeField] private Vector3[] patrolWaypoints = new Vector3[0];
        [SerializeField] private float chaseStopDistance = 2f; // Khoảng cách dừng đuổi
        [SerializeField] private float chaseLoseRange = 25f; // Khoảng cách mất player
        [SerializeField] private float attackRange = 1.5f; // Tầm tấn công
        [SerializeField] private float attackDamage = 10f; // Sát thương
        [SerializeField] private float attackCooldown = 1f; // Cooldown tấn công
        [SerializeField] private float investigateWaitTime = 2f; // Thời gian chờ sau khi check
        
        private PatrolState patrolState;
        private ChaseState chaseState;
        private AttackState attackState;
        private InvestigateState investigateState;
        
        private float investigateStartTime = 0f; // Để track thời gian ở Investigate

        protected override void Awake()
        {
            base.Awake();
            monsterName = "Ông Kẹ";
        }

        private void Start()
        {
            // Khởi tạo states
            patrolState = new PatrolState(this, patrolWaypoints);
            chaseState = new ChaseState(this, chaseStopDistance, chaseLoseRange);
            attackState = new AttackState(this, attackRange, attackDamage, attackCooldown);
            
            // InvestigateState sẽ được tạo khi cần (có vị trí để check)
            investigateState = null;

            // Bắt đầu ở state patrol
            ChangeState(patrolState);
        }

        private void Update()
        {
            // Gọi base.Update() trước để cập nhật state
            base.Update();

            // 🔴 KIỂM TRA TIMEOUT CỦA INVESTIGATE (độc lập với detection)
            // Vì Investigate có thể còn detect player nên phải check riêng
            if (currentState is InvestigateState)
            {
                float investigateElapsed = Time.time - investigateStartTime;
                if (investigateElapsed >= investigateWaitTime)
                {
                    Debug.Log($"⚠️ OngKe: Check xong ({investigateElapsed:F1}s), quay lại patrol");
                    ChangeState(patrolState);
                    return; // Thoát khỏi hàm Update để tránh logic phía dưới
                }
            }

            // Xử lý state transitions
            if (!IsPlayerDetected())
            {
                // Không detect player nữa
                if (currentState is ChaseState)
                {
                    // Đang Chase nhưng mất player
                    // → Chuyển sang Investigate (trong vòng 2s timeout của Chase)
                    ChaseState chaseState = currentState as ChaseState;
                    if (chaseState.HasLostPlayer())
                    {
                        Vector3 lastPlayerPos = chaseState.GetLastSeenPlayerPosition();
                        Debug.Log($"⚠️ OngKe: Mất player trong Chase, Investigate vị trí ({lastPlayerPos})");
                        
                        investigateState = new InvestigateState(this, lastPlayerPos);
                        investigateStartTime = Time.time;
                        ChangeState(investigateState);
                    }
                }
                else if (!(currentState is PatrolState) && !(currentState is InvestigateState))
                {
                    // Attack state mà mất player → quay lại Investigate vị trí cuối
                    Vector3 lastPlayerPos = playerDetector.GetLastDetectedPlayerPosition();
                    Debug.Log($"⚠️ OngKe: Mất player từ Attack, Investigate vị trí ({lastPlayerPos})");
                    
                    investigateState = new InvestigateState(this, lastPlayerPos);
                    investigateStartTime = Time.time;
                    ChangeState(investigateState);
                }
            }
            else
            {
                // Detect player rồi
                float distanceToPlayer = Vector3.Distance(transform.position, GetPlayerPosition());

                // Thêm hysteresis: Attack có margin 0.5m để tránh oscillate
                float effectiveAttackRange = attackRange;
                if (currentState is AttackState)
                {
                    effectiveAttackRange = attackRange + 0.5f; // Phải > 1.5+0.5=2m mới thoát attack
                }

                // Check xem có trong tầm tấn công không
                if (distanceToPlayer <= effectiveAttackRange)
                {
                    // Chuyển sang Attack
                    if (!(currentState is AttackState))
                    {
                        Debug.Log($"⚠️ OngKe: Gần player → Attack (Distance: {distanceToPlayer:F1}m)");
                        ChangeState(attackState);
                    }
                }
                else if (distanceToPlayer <= chaseLoseRange)
                {
                    // Chuyển sang Chase
                    if (!(currentState is ChaseState))
                    {
                        Debug.Log($"⚠️ OngKe: Detect player → Chase (Distance: {distanceToPlayer:F1}m)");
                        ChangeState(chaseState);
                    }
                }
                else
                {
                    // Quá xa → Patrol
                    if (!(currentState is PatrolState))
                    {
                        Debug.Log($"⚠️ OngKe: Player quá xa → Patrol (Distance: {distanceToPlayer:F1}m)");
                        ChangeState(patrolState);
                    }
                }
            }

            // Debug info (Press D)
            if (Application.isEditor && Keyboard.current.dKey.wasPressedThisFrame)
            {
                Debug.Log($"=== OngKe DEBUG ===");
                Debug.Log($"State: {currentState?.GetType().Name ?? "NULL"}");
                Debug.Log($"Position: {transform.position}");
                Debug.Log($"IsMoving: {IsMoving()}");
                Debug.Log($"PlayerDetected: {IsPlayerDetected()}");
                if (IsPlayerDetected())
                {
                    float dist = Vector3.Distance(transform.position, GetPlayerPosition());
                    Debug.Log($"PlayerDistance: {dist:F1}m");
                    Debug.Log($"  - Attack Range: {attackRange:F1}m {(dist <= attackRange ? "✅ IN RANGE" : "❌ OUT OF RANGE")}");
                    Debug.Log($"  - Chase Range: {chaseLoseRange:F1}m {(dist <= chaseLoseRange ? "✅ IN RANGE" : "❌ OUT OF RANGE")}");
                }
                Debug.Log($"Waypoints Count: {patrolWaypoints.Length}");
            }
        }

        /// <summary>
        /// Thiết lập waypoints cho patrol (dùng từ level editor hoặc code)
        /// </summary>
        public void SetPatrolWaypoints(Vector3[] waypoints)
        {
            patrolWaypoints = waypoints;
        }

        /// <summary>
        /// Debug: vẽ waypoints
        /// </summary>
        private void OnDrawGizmos()
        {
            base.OnDrawGizmos();

            // Vẽ patrol waypoints
            if (patrolWaypoints != null && patrolWaypoints.Length > 0)
            {
                Gizmos.color = Color.yellow;
                for (int i = 0; i < patrolWaypoints.Length; i++)
                {
                    Gizmos.DrawSphere(patrolWaypoints[i], 0.25f);

                    int nextIndex = (i + 1) % patrolWaypoints.Length;
                    Gizmos.DrawLine(patrolWaypoints[i], patrolWaypoints[nextIndex]);
                }

                // Vẽ từ quái đến waypoint đầu tiên
                Gizmos.color = Color.green;
                Gizmos.DrawLine(transform.position, patrolWaypoints[0]);
            }
        }
    }
}
