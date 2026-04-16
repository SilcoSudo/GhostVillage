using Game.Scripts.Gameplay.Core;
using UnityEngine;
using UnityEngine.AI;

namespace GhostVillage.Gameplay.Base
{
    /// <summary>
    /// Base class cho tất cả quái vật trong game
    /// </summary>
    public abstract class MonsterBase : MonoBehaviour
    {
        [Header("--- Monster Config ---")]
        [SerializeField] protected string monsterName = "Monster";
        [SerializeField] protected float moveSpeed = 3.5f;
        [SerializeField] protected float stoppingDistance = 0.5f;

        /// <summary>
        /// NavMeshAgent dùng để di chuyển
        /// </summary>
        protected NavMeshAgent navMeshAgent;

        /// <summary>
        /// State hiện tại của quái
        /// </summary>
        protected IMonsterState currentState;

        /// <summary>
        /// Transform của quái
        /// </summary>
        protected Transform monsterTransform;

        /// <summary>
        /// Player detector
        /// </summary>
        protected GhostVillage.Gameplay.Shared.PlayerDetector playerDetector;

        protected virtual void Awake()
        {
            monsterTransform = transform;
            navMeshAgent = GetComponent<NavMeshAgent>();

            if (navMeshAgent == null)
            {
                navMeshAgent = gameObject.AddComponent<NavMeshAgent>();
            }

            // Cấu hình NavMeshAgent
            navMeshAgent.speed = moveSpeed;
            navMeshAgent.stoppingDistance = stoppingDistance;
            navMeshAgent.updateRotation = false;
            navMeshAgent.updatePosition = true;

            // Thêm Collider nếu chưa có
            Collider collider = GetComponent<Collider>();
            if (collider == null)
            {
                collider = gameObject.AddComponent<CapsuleCollider>();
                CapsuleCollider capsule = collider as CapsuleCollider;
                if (capsule != null)
                {
                    capsule.radius = 0.5f;
                    capsule.height = 1f;
                    capsule.center = Vector3.zero;
                }
            }

            // Thêm Rigidbody nếu chưa có
            Rigidbody rb = GetComponent<Rigidbody>();
            if (rb == null)
            {
                rb = gameObject.AddComponent<Rigidbody>();
                rb.isKinematic = true;
                rb.useGravity = false;
            }

            // Khởi tạo player detector
            playerDetector = GetComponent<GhostVillage.Gameplay.Shared.PlayerDetector>();
            if (playerDetector == null)
            {
                playerDetector = gameObject.AddComponent<GhostVillage.Gameplay.Shared.PlayerDetector>();
            }
        }

        protected virtual void Update()
        {
            if (currentState != null)
            {
                currentState.Update();

                // Kiểm tra xem state có nên kết thúc không
                if (currentState.ShouldExit())
                {
                    ExitCurrentState();
                    // Không để currentState = null, mà phải set default state
                    // Để tránh logic bị lẫn lộn ở controller (OngKeMonster, v.v.)
                }
            }
        }

        /// <summary>
        /// Chuyển sang state mới
        /// </summary>
        protected void ChangeState(IMonsterState newState)
        {
            if (currentState != null)
            {
                currentState.Exit();
            }

            currentState = newState;

            if (currentState != null)
            {
                currentState.Enter();
            }
        }

        /// <summary>
        /// Thoát state hiện tại
        /// </summary>
        protected void ExitCurrentState()
        {
            if (currentState != null)
            {
                currentState.Exit();
                currentState = null;
            }
        }

        /// <summary>
        /// Set default state (gọi khi currentState timeout)
        /// Để tránh state null khi OngKeMonster logic kiểm tra
        /// </summary>
        public virtual void SetDefaultState(IMonsterState defaultState)
        {
            if (currentState == null)
            {
                currentState = defaultState;
                currentState.Enter();
            }
        }

        /// <summary>
        /// Di chuyển quái đến vị trí đích
        /// </summary>
        public virtual void MoveTo(Vector3 destination)
        {
            if (navMeshAgent != null && navMeshAgent.isOnNavMesh)
            {
                navMeshAgent.SetDestination(destination);
            }
        }

        /// <summary>
        /// Dừng di chuyển
        /// </summary>
        public virtual void Stop()
        {
            if (navMeshAgent != null && navMeshAgent.isOnNavMesh)
            {
                navMeshAgent.ResetPath();
            }
        }

        /// <summary>
        /// Kiểm tra xem quái có đang di chuyển không
        /// </summary>
        public virtual bool IsMoving()
        {
            return navMeshAgent != null && navMeshAgent.isOnNavMesh &&
                   navMeshAgent.hasPath && navMeshAgent.remainingDistance > stoppingDistance;
        }

        /// <summary>
        /// Quay hướng quái theo hướng di chuyển (smooth)
        /// </summary>
        public virtual void LookForward()
        {
            if (navMeshAgent != null && navMeshAgent.velocity.sqrMagnitude > 0.01f)
            {
                Vector3 direction = navMeshAgent.velocity.normalized;
                if (direction.sqrMagnitude > 0.01f)
                {
                    // Smooth quay (lerp) thay vì set trực tiếp
                    Quaternion targetRotation = Quaternion.LookRotation(direction);
                    monsterTransform.rotation = Quaternion.Lerp(monsterTransform.rotation, targetRotation, Time.deltaTime * 5f);
                }
            }
        }

        /// <summary>
        /// Quay hướng quái nhìn về player (smooth)
        /// </summary>
        public virtual void LookAtPlayer()
        {
            if (playerDetector == null || !playerDetector.IsPlayerDetected())
                return;

            Vector3 directionToPlayer = playerDetector.GetPlayerPosition() - monsterTransform.position;
            if (directionToPlayer.sqrMagnitude > 0.01f)
            {
                // Smooth quay (lerp) thay vì set trực tiếp
                Quaternion targetRotation = Quaternion.LookRotation(directionToPlayer.normalized);
                monsterTransform.rotation = Quaternion.Lerp(monsterTransform.rotation, targetRotation, Time.deltaTime * 5f);
            }
        }

        /// <summary>
        /// Kiểm tra xem player có được detect không
        /// </summary>
        public virtual bool IsPlayerDetected()
        {
            return playerDetector != null && playerDetector.IsPlayerDetected();
        }

        /// <summary>
        /// Lấy vị trí player
        /// </summary>
        public virtual Vector3 GetPlayerPosition()
        {
            return playerDetector != null ? playerDetector.GetPlayerPosition() : Vector3.zero;
        }

        /// <summary>
        /// Getter cho NavMeshAgent
        /// </summary>
        public NavMeshAgent GetNavMeshAgent()
        {
            return navMeshAgent;
        }

        /// <summary>
        /// Getter cho PlayerDetector
        /// </summary>
        public GhostVillage.Gameplay.Shared.PlayerDetector GetPlayerDetector()
        {
            return playerDetector;
        }

        /// <summary>
        /// Debug: vẽ hướng hiện tại
        /// </summary>
        protected virtual void OnDrawGizmos()
        {
            if (Application.isPlaying)
            {
                Gizmos.color = Color.green;
                Gizmos.DrawRay(monsterTransform.position, monsterTransform.forward);
            }
        }

        /// <summary>
        /// [MỚI] Áp dụng các hiệu ứng từ sự kiện Trăng (Moon Event)
        /// CHỈ CHỈNH SỬA TỐC ĐỘ DI CHUYỂN (An toàn cho mọi loại quái).
        /// </summary>
        public virtual void ApplyMoonModifiers(MoonEventManager moonManager)
        {
            if (moonManager == null || navMeshAgent == null) return;

            // Lấy hệ số tốc độ từ Trăng
            float speedMult = moonManager.GetMonsterSpeedMultiplier();

            // Áp dụng thẳng vào NavMeshAgent
            navMeshAgent.speed = moveSpeed * speedMult;

            Debug.Log($"[MonsterBase] Đã buff Trăng cho <color=orange>{monsterName}</color> | Tốc độ mới: {navMeshAgent.speed} (Gốc: {moveSpeed} x {speedMult})");
        }
    }
}
