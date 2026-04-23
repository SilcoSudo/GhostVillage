using UnityEngine;
using GhostVillage.Gameplay.Base;
using GhostVillage.Gameplay.Shared;
using UnityEngine.InputSystem;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;

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
        [Tooltip("Waypoint dạng Transform (nếu có) sẽ được convert sang Vector3 lúc Start")]
        [SerializeField] private Transform[] patrolWaypointRefs = new Transform[0];
        [Tooltip("Tự tìm waypoint trong scene nếu chưa set patrolWaypoints")]
        [SerializeField] private bool autoFindPatrolWaypointsFromScene = true;
        [Tooltip("Tên root chứa waypoint của VongNhi trong scene")]
        [SerializeField] private string patrolWaypointRootName = "VongNhi Patrol";

        [Header("--- Flee ---")]
        [Tooltip("Thời gian chạy trốn sau khi báo động (giây)")]
        [SerializeField] private float fleeDuration = 8f;
        [Tooltip("Khoảng cách mỗi lần cập nhật điểm chạy trốn")]
        [SerializeField] private float fleeDistance = 15f;

        [Header("--- Alert ---")]
        [Tooltip("Cooldown giữa 2 lần báo động liên tiếp (giây). Tránh spam.")]
        [SerializeField] private float alertCooldown = 20f;

        [Header("--- Drowned-Style Chase ---")]
        [Tooltip("Bật để VongNhi đuổi player gần nhất giống Drowned (không patrol/flee).")]
        [SerializeField] private bool useDrownedStyleChase = true;

        // ── States ──────────────────────────────────────────────
        private PatrolState patrolState;
        private FleeState   fleeState;

        // ── Runtime ─────────────────────────────────────────────
        private float lastAlertTime = -999f;  // âm lớn → có thể báo ngay từ đầu
        private bool  _isKeoCo  = false;        // đang tham gia kéo co, bỏ qua patrol/alert
        private Transform _keoCoPlayerTf = null;
        private PhotonView _photonView;
        private PhotonTransformView _photonTransformView;
        private PhotonAnimatorView _photonAnimatorView;
        protected override void Awake()
        {
            base.Awake();
            monsterName = "Vòng Nhi";
            EnsurePhotonSyncComponents();
        }

        private void EnsurePhotonSyncComponents()
        {
            _photonView = GetComponent<PhotonView>();
            if (_photonView == null)
            {
                _photonView = gameObject.AddComponent<PhotonView>();
            }

            _photonTransformView = GetComponent<PhotonTransformView>();
            if (_photonTransformView == null)
            {
                _photonTransformView = gameObject.AddComponent<PhotonTransformView>();
            }

            Animator localAnimator = GetComponent<Animator>();

            _photonAnimatorView = GetComponent<PhotonAnimatorView>();
            if (localAnimator == null)
            {
                // Không có Animator thì tắt sync animator để tránh MissingComponentException.
                if (_photonAnimatorView != null)
                {
                    _photonAnimatorView.enabled = false;
                }
            }
            else
            {
                if (_photonAnimatorView == null)
                {
                    _photonAnimatorView = gameObject.AddComponent<PhotonAnimatorView>();
                }

                // Mirror MaDa/Drowned setup: layer 0 continuous + Speed float continuous when present.
                _photonAnimatorView.SetLayerSynchronized(0, PhotonAnimatorView.SynchronizeType.Continuous);
                if (HasAnimatorFloatParameter("Speed"))
                {
                    _photonAnimatorView.SetParameterSynchronized(
                        "Speed",
                        PhotonAnimatorView.ParameterType.Float,
                        PhotonAnimatorView.SynchronizeType.Continuous);
                }
            }

            if (_photonView.ObservedComponents == null)
            {
                _photonView.ObservedComponents = new List<Component>();
            }

            if (!_photonView.ObservedComponents.Contains(_photonTransformView))
            {
                _photonView.ObservedComponents.Add(_photonTransformView);
            }

            if (_photonAnimatorView != null && _photonAnimatorView.enabled && !_photonView.ObservedComponents.Contains(_photonAnimatorView))
            {
                _photonView.ObservedComponents.Add(_photonAnimatorView);
            }

            _photonView.Synchronization = ViewSynchronization.UnreliableOnChange;
        }

        private bool HasAnimatorFloatParameter(string parameterName)
        {
            Animator localAnimator = GetComponent<Animator>();
            if (localAnimator == null)
            {
                return false;
            }

            for (int i = 0; i < localAnimator.parameters.Length; i++)
            {
                var parameter = localAnimator.parameters[i];
                if (parameter.name == parameterName && parameter.type == AnimatorControllerParameterType.Float)
                {
                    return true;
                }
            }

            return false;
        }

        private void Start()
        {
            if (useDrownedStyleChase)
            {
                Debug.Log("[VongNhi] Drowned-style chase đã bật: bỏ qua Patrol/Flee state.");
                return;
            }

            if ((patrolWaypoints == null || patrolWaypoints.Length == 0) && patrolWaypointRefs != null && patrolWaypointRefs.Length > 0)
            {
                List<Vector3> points = new List<Vector3>();
                for (int i = 0; i < patrolWaypointRefs.Length; i++)
                {
                    Transform t = patrolWaypointRefs[i];
                    if (t != null) points.Add(t.position);
                }

                if (points.Count > 0)
                {
                    patrolWaypoints = points.ToArray();
                    Debug.Log($"[VongNhi] Auto convert patrolWaypointRefs -> patrolWaypoints: {patrolWaypoints.Length} điểm.");
                }
            }

            if ((patrolWaypoints == null || patrolWaypoints.Length == 0) && autoFindPatrolWaypointsFromScene)
            {
                Transform waypointRoot = GameObject.Find(patrolWaypointRootName)?.transform;
                if (waypointRoot != null)
                {
                    List<Vector3> points = new List<Vector3>();
                    for (int i = 0; i < waypointRoot.childCount; i++)
                    {
                        Transform child = waypointRoot.GetChild(i);
                        if (child != null) points.Add(child.position);
                    }

                    if (points.Count > 0)
                    {
                        patrolWaypoints = points.ToArray();
                        Debug.Log($"[VongNhi] Auto map waypoint từ root '{patrolWaypointRootName}': {patrolWaypoints.Length} điểm.");
                    }
                }
            }

            patrolState = new PatrolState(this, patrolWaypoints);
            fleeState   = new FleeState(this, fleeDuration, fleeDistance);

            ChangeState(patrolState);
            Debug.Log("[VongNhi] Khởi động. PatrolWaypoints: " + patrolWaypoints.Length);
        }

        private void Update()
        {
            if (useDrownedStyleChase)
            {
                UpdateDrownedStyleChase();
                return;
            }

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

        private void UpdateDrownedStyleChase()
        {
            if (_isKeoCo)
            {
                if (_keoCoPlayerTf != null)
                {
                    Vector3 dir = (_keoCoPlayerTf.position - transform.position);
                    dir.y = 0f;
                    if (dir.sqrMagnitude > 0.01f)
                    {
                        transform.rotation = Quaternion.Slerp(
                            transform.rotation,
                            Quaternion.LookRotation(dir.normalized),
                            Time.deltaTime * 5f);
                    }
                }
                return;
            }

            Transform closestPlayer = GetClosestStandingPlayer();
            if (closestPlayer != null)
            {
                MoveTo(closestPlayer.position);
                LookForward();

                bool cooldownOk = Time.time - lastAlertTime >= alertCooldown;
                if (cooldownOk)
                {
                    MonsterEvents.AlertPlayerSpotted(closestPlayer.position);
                    lastAlertTime = Time.time;
                }
            }
            else
            {
                Stop();
            }
        }

        private Transform GetClosestStandingPlayer()
        {
            var players = FindObjectsByType<FPSController>(FindObjectsSortMode.None);
            if (players == null || players.Length == 0) return null;

            return players
                .Where(p =>
                {
                    var knockedState = p.GetComponent<PlayerKnockedState>();
                    return knockedState != null && !knockedState.isKnocked;
                })
                .OrderBy(p => Vector3.Distance(transform.position, p.transform.position))
                .FirstOrDefault()?.transform;
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
            if (!useDrownedStyleChase)
            {
                ChangeState(fleeState);
            }
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
            if (!useDrownedStyleChase)
            {
                ChangeState(fleeState);
            }
        }

        /// <summary>Hủy kéo co (không thắng/thua): quay về patrol để có thể chơi lại</summary>
        public void CancelKeoCo()
        {
            _isKeoCo = false;
            _keoCoPlayerTf = null;

            if (!useDrownedStyleChase && currentState != patrolState)
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
