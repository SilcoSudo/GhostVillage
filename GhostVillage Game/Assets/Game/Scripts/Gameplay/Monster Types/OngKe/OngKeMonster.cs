using UnityEngine;
using GhostVillage.Gameplay.Base;
using GhostVillage.Gameplay.Shared;
using UnityEngine.InputSystem;
using Photon.Pun;
using System.Collections.Generic;
using System.Linq;
using UnityEngine.SceneManagement;

namespace GhostVillage.Gameplay.Monsters.OngKe
{
    public enum OngKeStateType { None, Patrol, Chase, Attack, Investigate, Siren }

    /// <summary>
    /// Ông Kẹ - Boss quái Map 1 | Enum/Switch Pattern (không null state)
    /// </summary>
    public class OngKeMonster : MonsterBase
    {
        [Header("--- Patrol ---")]
        [Tooltip("Các tâm vùng patrol. Để trống = tự tìm via tag 'WayPoint'")]
        [SerializeField] private Transform[] patrolZones;
        [Tooltip("Tự tìm zone trong scene bằng tag 'WayPoint' nếu patrolZones đang rỗng")]
        [SerializeField] private bool autoFindPatrolZonesFromScene = true;
        [Tooltip("Bán kính di chuyển ngẫu nhiên quanh mỗi zone")]
        [SerializeField] private float patrolRadius = 25f;
        [Tooltip("Phần bán kính bị trừ ở mép zone để tránh bám sát tường/rìa collider")]
        [SerializeField] private float patrolEdgePadding = 2f;
        [Tooltip("Layer vật cản dùng để loại bỏ target patrol bị chặn bởi collider")]
        [SerializeField] private LayerMask patrolObstacleMask = default;

        [Header("--- Combat ---")]
        [SerializeField] private float chaseRange = 60f;
        [SerializeField] private float attackRange = 1.5f;
        [SerializeField] private float attackCooldown = 1f;
        [Tooltip("Bật để đòn đánh của Ông Kẹ dùng jumpscare camera trước khi knock")]
        [SerializeField] private bool useJumpscareAttack = true;

        [Header("--- Pull Skill ---")]
        [Tooltip("Tầm xa của nón hút")]
        [SerializeField] private float pullActivationRange = 15f;
        [Tooltip("Góc nửa nón (VD: 60 = nón 120°)")]
        [SerializeField] private float pullConeHalfAngle = 60f;
        [Tooltip("Lực hút tối đa (khi player sát)")]
        [SerializeField] private float pullMaxForce = 12f;
        [Tooltip("Lực hút tối thiểu (khi player ở rìa xa)")]
        [SerializeField] private float pullMinForce = 3f;
        [Tooltip("Thời gian niệm phép trước khi hút (giây)")]
        [SerializeField] private float pullCastTime = 1.5f;
        [Tooltip("Thời gian hút (giây)")]
        [SerializeField] private float pullDuration = 3f;
        [Tooltip("Cooldown giữa 2 lần dùng skill (giây)")]
        [SerializeField] private float pullCooldown = 32f;
        
        private OngKeStateType currentStateType = OngKeStateType.None;
        private RandomPatrolState patrolState;
        private ChaseState chaseState;
        private AttackState attackState;
        private InvestigateState investigateState;
        private SirenState sirenState;
        private PullSkill pullSkill;
        private Vector3 lastKnownPos = Vector3.zero;
        private float chaseTimer = 0f;
        private bool hasResetChaseLostSight = false;
        private bool investigateExitWasPlayerDetected = false;
        private PhotonView _photonView;
        private PhotonTransformView _photonTransformView;
        private PhotonAnimatorView _photonAnimatorView;

        // ── Forced Chase (triggered bởi Puzzle thua) ──────────────────────
        private Transform _forcedChaseTarget = null;
        private float _forcedChaseTimer = 0f;

        // ── Fake Chicken Alarm (triggered bởi ChickenHunt khi gà giả kêu) ──
        public void OnFakeChickenAlarm(Vector3 alarmPosition)
        {
            Debug.Log($"[OngKe] Gà giả kêu tại {alarmPosition}! Chuyển sang Investigate");
            ChangeStateType(OngKeStateType.Investigate, alarmPosition);
        }

        // ── Siren Item Alarm (triggered khi player dùng item sáo) ──────────
        public void OnSirenActivated(Vector3 sirenPosition)
        {
            Debug.Log($"[OngKe] Nghe tiếng sáo tại {sirenPosition}! Chuyển sang Siren state");
            ChangeStateType(OngKeStateType.Siren, sirenPosition);
        }

        protected override void Awake()
        {
            base.Awake();
            monsterName = "Ông Kẹ";
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

        // ─────────────────────────────────────────────────────────────────────
        // Được gọi từ TugOfWarPuzzle (MasterClient only) khi người chơi thua kéo co.
        // Bỏ qua PlayerDetector – OngKe đuổi thẳng target trong duration giây.
        // ─────────────────────────────────────────────────────────────────────
        public void ForceChasePlayer(Transform target, float duration = 20f)
        {
            if (target == null) return;
            _forcedChaseTarget = target;
            _forcedChaseTimer = duration;
            Debug.Log($"[OngKe] ForceChase → {target.name} trong {duration}s");
            ChangeStateType(OngKeStateType.Chase);
        }

        // Override để ChaseState "thấy" player kể cả khi PlayerDetector không detect
        public override bool IsPlayerDetected()
        {
            if (_forcedChaseTarget != null) return true;
            return base.IsPlayerDetected();
        }

        public override Vector3 GetPlayerPosition()
        {
            if (_forcedChaseTarget != null) return _forcedChaseTarget.position;
            return base.GetPlayerPosition();
        }

        private void Start()
        {
            Debug.Log($"[OngKe] Start() called");

            if (autoFindPatrolZonesFromScene && (patrolZones == null || patrolZones.Length == 0))
            {
                Debug.Log($"[OngKe] 🔍 Searching for patrol zones via tag 'WayPoint'...");
                
                // Tìm tất cả GameObjects có tag 'WayPoint' (giống MaDa)
                GameObject[] wpObjects = GameObject.FindGameObjectsWithTag("WayPoint");
                if (wpObjects != null && wpObjects.Length > 0)
                {
                    patrolZones = wpObjects.Select(go => go.transform).ToArray();
                    Debug.Log($"[OngKe] ✓ Found {patrolZones.Length} waypoints via tag 'WayPoint'");
                    for (int i = 0; i < patrolZones.Length; i++)
                    {
                        Debug.Log($"[OngKe]   └─ WayPoint {i}: {patrolZones[i].name} at {patrolZones[i].position}");
                    }
                }
                else
                {
                    Debug.LogWarning($"[OngKe] ❌ NO WAYPOINTS FOUND! Please tag patrol zone GameObjects with tag 'WayPoint'");
                }
            }

            if (patrolZones != null)
            {
                patrolZones = System.Array.FindAll(patrolZones, t => t != null);
            }

            Debug.Log($"[OngKe] patrolObstacleMask value: {patrolObstacleMask.value} (tên layer được check: {(patrolObstacleMask == default ? "Wall,Boundary" : "Custom set")})");

            if (patrolZones != null && patrolZones.Length > 0)
            {
                Vector3[] zonePositions = System.Array.ConvertAll(patrolZones, t => t.position);
                patrolState = new RandomPatrolState(this, zonePositions, patrolRadius, 1.2f, 1.5f, patrolEdgePadding, patrolObstacleMask);
                Debug.Log($"[OngKe] ✓ Patrol zones: {patrolZones.Length} zone(s), radius: {patrolRadius}m, edgePadding: {patrolEdgePadding}m");
            }
            else
            {
                Debug.LogError($"[OngKe] ❌ NO PATROL ZONES FOUND! Ông Kẹ needs patrol zones to work properly. Please setup 'Patrol zone' GameObject with children zones in the scene.");
                enabled = false;
                return;
            }
            chaseState = new ChaseState(this, 2f, chaseRange);
            attackState = new AttackState(this, attackRange, attackCooldown, useJumpscareAttack);
            sirenState = new SirenState(this);
            pullSkill = new PullSkill(transform, pullActivationRange, pullConeHalfAngle, pullMaxForce, pullMinForce, pullCastTime, pullDuration, pullCooldown);

            Debug.Log($"[OngKe] ✓ States initialized");
            Debug.Log($"[OngKe] ✓ PatrolOrigin: {transform.position} | Radius: {patrolRadius}m");
            Debug.Log($"[OngKe] ✓ NavMeshAgent: {GetComponent<UnityEngine.AI.NavMeshAgent>()}");

            ChangeStateType(OngKeStateType.Patrol);

            Debug.Log($"✓ Start() complete - currentState: {currentState}");
        }

        private void ChangeStateType(OngKeStateType newState, Vector3 investigatePos = default)
        {
            if (currentStateType == newState) return;
            
            try
            {
                Debug.Log($"[ChangeStateType] Exit {currentState?.GetType().Name}");
                currentState?.Exit();
                
                Debug.Log($"🔄 Transition: {currentStateType} → {newState}");
                currentStateType = newState;

                switch (newState)
            {
                case OngKeStateType.Patrol:
                    Debug.Log($"  [ChangeState] patrolState = {patrolState}");
                    ChangeState(patrolState);
                    chaseTimer = 0f;
                    Debug.Log($"  [ChangeState] Done. currentState = {currentState}");
                    break;
                case OngKeStateType.Chase:
                    Debug.Log($"  [ChangeState] chaseState = {chaseState}");
                    ChangeState(chaseState);
                    // KHÔNG reset chaseTimer ở đây - sẽ reset khi mất sight (Phase B) lần đầu
                    hasResetChaseLostSight = false; // Reset flag để chuẩn bị cho Phase B
                    Debug.Log($"  [ChangeState] Done. currentState = {currentState}");
                    break;
                case OngKeStateType.Attack:
                    Debug.Log($"  [ChangeState] attackState = {attackState}");
                    ChangeState(attackState);
                    Debug.Log($"  [ChangeState] Done. currentState = {currentState}");
                    break;
                case OngKeStateType.Investigate:
                    Debug.Log($"  [ChangeState] Creating InvestigateState({investigatePos})");
                    investigateState = new InvestigateState(this, investigatePos);
                    Debug.Log($"  [ChangeState] Calling ChangeState(investigateState)");
                    ChangeState(investigateState);
                    Debug.Log($"  [ChangeState] Done. currentState = {currentState}");
                    break;
                case OngKeStateType.Siren:
                    Debug.Log($"  [ChangeState] Creating SirenState({investigatePos})");
                    sirenState = new SirenState(this, investigatePos);
                    Debug.Log($"  [ChangeState] Calling ChangeState(sirenState)");
                    ChangeState(sirenState);
                    Debug.Log($"  [ChangeState] Done. currentState = {currentState}");
                    break;
            }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($" [ChangeStateType] ERROR during {newState} transition: {ex.Message}\n{ex.StackTrace}");
                currentState = null;
            }
        }

        protected override void Update()
        {
            // IMPORTANT: For Investigate/Siren state, we need to capture exit reason BEFORE base.Update() clears currentState
            if (currentStateType == OngKeStateType.Investigate && currentState != null)
            {
                InvestigateState invState = currentState as InvestigateState;
                if (invState != null && invState.ShouldExit())
                {
                    // Save exit reason before state gets cleared
                    investigateExitWasPlayerDetected = invState.WasPlayerDetected();
                }
            }

            // Handle Siren state exit
            if (currentStateType == OngKeStateType.Siren && currentState != null)
            {
                SirenState sirenStateInstance = currentState as SirenState;
                if (sirenStateInstance != null && sirenStateInstance.ShouldExit())
                {
                    investigateExitWasPlayerDetected = sirenStateInstance.WasPlayerDetected();
                }
            }

            // Handle Siren state exit
            if (currentStateType == OngKeStateType.Siren && currentState != null)
            {
                SirenState sirenStateInstance = currentState as SirenState;
                if (sirenStateInstance != null && sirenStateInstance.ShouldExit())
                {
                    investigateExitWasPlayerDetected = sirenStateInstance.WasPlayerDetected();
                }
            }
            
            base.Update();

            // Cập nhật skill (cooldown + cast + hút)
            Vector3? pullLookDir = pullSkill.Update();

            // Khi đang Cast: đứng yên + quay nhìn về player
            if (pullSkill.IsCasting)
            {
                Stop();
                if (pullLookDir.HasValue && pullLookDir.Value.sqrMagnitude > 0.01f)
                {
                    Quaternion target = Quaternion.LookRotation(pullLookDir.Value.normalized);
                    transform.rotation = Quaternion.Lerp(transform.rotation, target, Time.deltaTime * 10f);
                }
                return; // Bỏ qua toàn bộ FSM transition khi đang cast
            }
            
            chaseTimer += Time.deltaTime;

            bool detected = IsPlayerDetected();
            float dist = detected ? Vector3.Distance(transform.position, GetPlayerPosition()) : float.MaxValue;

            switch (currentStateType)
            {
                case OngKeStateType.Patrol:
                    if (detected && dist <= chaseRange)
                    {
                        Debug.Log($" Patrol→Chase ({dist:F1}m)");
                        ChangeStateType(OngKeStateType.Chase);
                    }
                    break;

                case OngKeStateType.Chase:
                    // ── Forced Chase (từ puzzle kéo co thua) ──────────────────
                    if (_forcedChaseTarget != null)
                    {
                        _forcedChaseTimer -= Time.deltaTime;
                        if (_forcedChaseTimer <= 0f)
                        {
                            Debug.Log("[OngKe] Forced chase hết thời gian → về Patrol");
                            _forcedChaseTarget = null;
                            ChangeStateType(OngKeStateType.Patrol);
                            break;
                        }
                        // Trong forced chase: bỏ qua toàn bộ detection logic bên dưới
                        break;
                    }

                    // Pull skill: kích hoạt khi player trong range và skill sẵn sàng
                    if (detected && pullSkill.IsReady)
                    {
                        Transform playerTf = playerDetector.GetPlayerTransform();
                        if (pullSkill.TryActivate(playerTf))
                            Debug.Log($"[Ông Kẹ] Pull skill activated!");
                    }

                    // Priority 1: In attack range
                    if (detected && dist <= attackRange)
                    {
                        Debug.Log($" Chase→Attack ({dist:F1}m)");
                        ChangeStateType(OngKeStateType.Attack);
                    }
                    // Priority 2: Lost player - bắt đầu đếm từ khi mất sight (Phase B)
                    else if (!detected && chaseState.HasLostPlayer())
                    {
                        // Reset timer CHỈ lần đầu mất sight
                        if (!hasResetChaseLostSight)
                        {
                            chaseTimer = 0f;
                            hasResetChaseLostSight = true;
                            Debug.Log($"🔴 Chase→Phase B: Reset timer, bắt đầu đếm 3s từ lúc mất sight");
                        }
                        
                        if (chaseTimer >= 3f)
                        {
                            // Lấy vị trí mới nhất từ tracking NavMesh trong 3s
                            lastKnownPos = chaseState.GetCurrentTrackedPlayerPosition();
                            Debug.Log($" Chase→Investigate ({lastKnownPos}) [dự đoán Phase B {chaseTimer:F1}s]");
                            ChangeStateType(OngKeStateType.Investigate, lastKnownPos);
                        }
                    }
                    // Priority 3: Player still visible but too far
                    else if (detected && dist > chaseRange)
                    {
                        Debug.Log($" Chase→Patrol ({dist:F1}m > {chaseRange}m)");
                        ChangeStateType(OngKeStateType.Patrol);
                    }
                    break;

                case OngKeStateType.Attack:
                    if (!detected)
                    {
                        lastKnownPos = playerDetector.GetLastDetectedPlayerPosition();
                        Debug.Log($" Attack→Investigate ({lastKnownPos})");
                        ChangeStateType(OngKeStateType.Investigate, lastKnownPos);
                    }
                    else if (dist > attackRange + 0.5f) // Hysteresis
                    {
                        Debug.Log($" Attack→Chase ({dist:F1}m)");
                        ChangeStateType(OngKeStateType.Chase);
                    }
                    break;

                case OngKeStateType.Investigate:
                    // InvestigateState was exited by MonsterBase.Update()
                    // We saved the exit reason in investigateExitWasPlayerDetected before state was cleared
                    
                    // Check if state was just cleared (means ShouldExit() returned true)
                    if (currentState == null)
                    {
                        // State has been cleared, use saved exit reason
                        if (investigateExitWasPlayerDetected)
                        {
                            Debug.Log($" Investigate→Chase (player detected during search)");
                            ChangeStateType(OngKeStateType.Chase);
                        }
                        else
                        {
                            Debug.Log($" Investigate→Patrol (timeout after 2s search)");
                            ChangeStateType(OngKeStateType.Patrol);
                        }
                        investigateExitWasPlayerDetected = false; // Reset flag
                    }
                    else if (currentState is InvestigateState invState)
                    {
                        // Still in Investigate state, just log debug info
                        Debug.Log($"🟡 Investigate: elapsed={invState.GetElapsedTime():F1}s, isSearching={invState.IsSearching()}");
                    }
                    break;

                case OngKeStateType.Siren:
                    // SirenState was exited by MonsterBase.Update()
                    // Similar to Investigate - we saved the exit reason
                    
                    if (currentState == null)
                    {
                        // State has been cleared, use saved exit reason
                        if (investigateExitWasPlayerDetected)
                        {
                            Debug.Log($" Siren→Chase (player detected at siren location)");
                            ChangeStateType(OngKeStateType.Chase);
                        }
                        else
                        {
                            Debug.Log($" Siren→Patrol (timeout after siren search)");
                            ChangeStateType(OngKeStateType.Patrol);
                        }
                        investigateExitWasPlayerDetected = false; // Reset flag
                    }
                    break;
            }

            // Debug: Press D
            if (Application.isEditor && Keyboard.current.dKey.wasPressedThisFrame)
            {
                Debug.Log($"=== OngKe [{currentStateType}] ===");
                Debug.Log($"Pos: {transform.position} | Detected: {detected}");
                if (detected) Debug.Log($"Dist: {dist:F1}m");
                Debug.Log($"Timers - Chase: {chaseTimer:F1}s");
            }
        }

        protected override void OnDrawGizmos()
        {
            base.OnDrawGizmos();

            // Vẽ pull skill cone
            pullSkill?.DrawGizmos();

            // Vẽ từng patrol zone
            if (patrolZones != null && patrolZones.Length > 0)
            {
                for (int i = 0; i < patrolZones.Length; i++)
                {
                    if (patrolZones[i] == null) continue;
                    Vector3 center = patrolZones[i].position;

                    // Vòng tròn vàng = patrol zone
                    Gizmos.color = Color.yellow;
                    DrawWireCircle(center, patrolRadius);

                    // Số thứ tự zone
                    #if UNITY_EDITOR
                    UnityEditor.Handles.Label(center + Vector3.up * 1.5f, $"Zone {i}");
                    #endif

                    // Đường nối giữa các zone
                    if (i < patrolZones.Length - 1 && patrolZones[i + 1] != null)
                    {
                        Gizmos.color = new Color(1f, 1f, 0f, 0.4f);
                        Gizmos.DrawLine(center, patrolZones[i + 1].position);
                    }
                }
            }
            else
            {
                // Chỉ 1 zone = spawn point
                Gizmos.color = Color.yellow;
                DrawWireCircle(transform.position, patrolRadius);
            }

            // Chase range (đỏ)
            Gizmos.color = new Color(1f, 0f, 0f, 0.3f);
            DrawWireCircle(transform.position, chaseRange);
        }

        private void DrawWireCircle(Vector3 center, float radius)
        {
            int segments = 36;
            float step = 360f / segments;
            for (int i = 0; i < segments; i++)
            {
                float a1 = Mathf.Deg2Rad * (i * step);
                float a2 = Mathf.Deg2Rad * ((i + 1) * step);
                Vector3 p1 = center + new Vector3(Mathf.Cos(a1), 0, Mathf.Sin(a1)) * radius;
                Vector3 p2 = center + new Vector3(Mathf.Cos(a2), 0, Mathf.Sin(a2)) * radius;
                Gizmos.DrawLine(p1, p2);
            }
        }
    }
}

