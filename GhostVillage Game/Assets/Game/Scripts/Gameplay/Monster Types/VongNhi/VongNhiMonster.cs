using UnityEngine;
using GhostVillage.Gameplay.Base;
using GhostVillage.Gameplay.Shared;
using UnityEngine.InputSystem;

namespace GhostVillage.Gameplay.Monsters.VongNhi
{
    /// <summary>
    /// Vòng Nhi — Quái phụ Map 1
    /// ─────────────────────────────────────────────────────────
    /// Hành vi:
    ///   - Patrol theo waypoints như bình thường
    ///   - Khi phát hiện player:
    ///       1. Fire MonsterEvents.OnPlayerSpotted → OngKe nhận tín hiệu
    ///       2. Chuyển sang FleeState (chạy ngược hướng player)
    ///   - Sau khi hết thời gian flee → quay lại Patrol
    ///   - Có alertCooldown để không spam báo động liên tục
    /// ─────────────────────────────────────────────────────────
    /// Inspector Setup:
    ///   1. Gắn script này vào prefab VongNhi (cần NavMeshAgent + PlayerDetector)
    ///   2. Set patrolWaypoints (≥ 2 điểm)
    ///   3. Chỉnh alertCooldown, fleeDuration theo ý muốn
    ///   4. KHÔNG cần gán OngKe — dùng event tự động
    /// </summary>
    public class VongNhiMonster : MonsterBase
    {
        [Header("--- Vòng Nhi Patrol ---")]
        [Tooltip("Các điểm patrol tuần tự")]
        [SerializeField] private Vector3[] patrolWaypoints = new Vector3[0];

        [Header("--- Flee ---")]
        [Tooltip("Thời gian chạy trốn sau khi báo động (giây)")]
        [SerializeField] private float fleeDuration = 8f;
        [Tooltip("Khoảng cách mỗi lần cập nhật điểm chạy trốn")]
        [SerializeField] private float fleeDistance = 15f;

        [Header("--- Alert ---")]
        [Tooltip("Cooldown giữa 2 lần báo động liên tiếp (giây). Tránh spam.")]
        [SerializeField] private float alertCooldown = 20f;

        // ── States ──────────────────────────────────────────────
        private PatrolState patrolState;
        private FleeState   fleeState;

        // ── Runtime ─────────────────────────────────────────────
        private float lastAlertTime = -999f;  // âm lớn → có thể báo ngay từ đầu
        private bool  _isKeoCo  = false;        // đang tham gia kéo co, bỏ qua patrol/alert
        private Transform _keoCoPlayerTf = null;
        protected override void Awake()
        {
            base.Awake();
            monsterName = "Vòng Nhi";
        }

        private void Start()
        {
            patrolState = new PatrolState(this, patrolWaypoints);
            fleeState   = new FleeState(this, fleeDuration, fleeDistance);

            ChangeState(patrolState);
            Debug.Log("[VongNhi] Khởi động. PatrolWaypoints: " + patrolWaypoints.Length);
        }

        private void Update()
        {
            // Lưu state trước khi base.Update() có thể null nó (khi ShouldExit = true)
            bool wasFleeingBefore = currentState is FleeState;

            base.Update();

            // ── Flee vừa kết thúc (ShouldExit) → về Patrol
            if (wasFleeingBefore && currentState == null)
            {
                Debug.Log("[VongNhi] Flee xong → quay lại Patrol.");
                ChangeState(patrolState);
                return;
            }

            // ── Đang kéo co → chỉ quay nhìn về phía player
            if (_isKeoCo)
            {
                if (_keoCoPlayerTf != null)
                {
                    Vector3 dir = (_keoCoPlayerTf.position - transform.position);
                    dir.y = 0f;
                    if (dir.sqrMagnitude > 0.01f)
                        transform.rotation = Quaternion.Slerp(
                            transform.rotation,
                            Quaternion.LookRotation(dir.normalized),
                            Time.deltaTime * 5f);
                }
                return;
            }

            // ── Đang Flee → không cần làm gì thêm
            if (currentState is FleeState) return;

            // ── Đang Patrol → kiểm tra có thấy player không
            if (IsPlayerDetected())
            {
                bool cooldownOk = Time.time - lastAlertTime >= alertCooldown;

                if (cooldownOk)
                {
                    // 1. Báo vị trí player cho OngKe
                    Vector3 playerPos = GetPlayerPosition();
                    MonsterEvents.AlertPlayerSpotted(playerPos);
                    lastAlertTime = Time.time;
                    Debug.Log($"[VongNhi] Đã báo OngKe! Player tại {playerPos}");
                }
                else
                {
                    Debug.Log($"[VongNhi] Phát hiện player nhưng còn cooldown ({alertCooldown - (Time.time - lastAlertTime):F0}s)");
                }

                // 2. Bỏ chạy dù cooldown có hết hay chưa
                ChangeState(fleeState);
            }
        }

        // ─────────────────────────────────────────────────────────
        // API cho KeoCoPuzzle (gọi từ MasterClient qua RPC)
        // ─────────────────────────────────────────────────────────

        /// <summary>Bắt đầu kéo co: dừng patrol, đứng yên, nhìn về phía player</summary>
        public void EnterKeoCo(Transform playerTf)
        {
            _isKeoCo = true;
            _keoCoPlayerTf = playerTf;
            Stop();
            Debug.Log("[VongNhi] Vào trạng thái kéo co.");
        }

        /// <summary>Vòng Nhi THUA kéo co → chạy trốn ngay</summary>
        public void LoseKeoCo()
        {
            _isKeoCo = false;
            _keoCoPlayerTf = null;
            Debug.Log("[VongNhi] Thua kéo co → chạy!");
            ChangeState(fleeState);
        }

        /// <summary>Vòng Nhi THẮNG kéo co → báo Ông Kẹ + chạy trốn</summary>
        public void WinKeoCo()
        {
            _isKeoCo = false;

            // Báo vị trí player cho Ông Kẹ (nếu còn trong cooldown bã, bỏ qua)
            Vector3 playerPos = _keoCoPlayerTf != null
                ? _keoCoPlayerTf.position
                : GetPlayerPosition();
            MonsterEvents.AlertPlayerSpotted(playerPos);
            lastAlertTime = Time.time;

            _keoCoPlayerTf = null;
            Debug.Log("[VongNhi] Thắng kéo co → báo Ông Kẹ + chạy!");
            ChangeState(fleeState);
        }

        /// <summary>Hủy kéo co (không thắng/thua): quay về patrol để có thể chơi lại</summary>
        public void CancelKeoCo()
        {
            _isKeoCo = false;
            _keoCoPlayerTf = null;

            if (currentState != patrolState)
                ChangeState(patrolState);

            Debug.Log("[VongNhi] Hủy kéo co → quay lại patrol.");
        }

#if UNITY_EDITOR
        private void OnDrawGizmos()
        {
            base.OnDrawGizmos();

            if (patrolWaypoints == null || patrolWaypoints.Length == 0) return;

            Gizmos.color = Color.cyan;
            for (int i = 0; i < patrolWaypoints.Length; i++)
            {
                Gizmos.DrawSphere(patrolWaypoints[i], 0.2f);
                int next = (i + 1) % patrolWaypoints.Length;
                Gizmos.DrawLine(patrolWaypoints[i], patrolWaypoints[next]);
            }
        }
#endif
    }
}
