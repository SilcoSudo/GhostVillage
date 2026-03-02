using UnityEngine;
using GhostVillage.Gameplay.Base;
using GhostVillage.Gameplay.Shared;
using UnityEngine.InputSystem;

namespace GhostVillage.Gameplay.Monsters.OngKe
{
    public enum OngKeStateType { None, Patrol, Chase, Attack, Investigate }

    /// <summary>
    /// Ông Kẹ - Boss quái Map 1 | Enum/Switch Pattern (không null state)
    /// </summary>
    public class OngKeMonster : MonsterBase
    {
        [Header("--- Patrol ---")]
        [Tooltip("Các tâm vùng patrol. Để trống = chỉ dùng spawn point.")]
        [SerializeField] private Transform[] patrolZones;
        [Tooltip("Bán kính di chuyển ngẫu nhiên quanh mỗi zone")]
        [SerializeField] private float patrolRadius = 25f;

        [Header("--- Combat ---")]
        [SerializeField] private float chaseRange = 25f;
        [SerializeField] private float attackRange = 1.5f;
        [SerializeField] private float attackDamage = 10f;
        [SerializeField] private float attackCooldown = 1f;

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
        private PullSkill pullSkill;
        
        private Vector3 lastKnownPos = Vector3.zero;
        private float chaseTimer = 0f;
        private bool hasResetChaseLostSight = false; // Track if we've reset timer when losing sight
        private bool investigateExitWasPlayerDetected = false; // Track why Investigate exited

        protected override void Awake()
        {
            base.Awake();
            monsterName = "Ông Kẹ";
        }

        private void Start()
        {
            Debug.Log($"🔧 OngKeMonster.Start() called");
            
            if (patrolZones != null && patrolZones.Length > 0)
            {
                Vector3[] zonePositions = System.Array.ConvertAll(patrolZones, t => t.position);
                patrolState = new RandomPatrolState(this, zonePositions, patrolRadius);
                Debug.Log($"✓ Patrol zones: {patrolZones.Length} zone(s), radius: {patrolRadius}m");
            }
            else
            {
                patrolState = new RandomPatrolState(this, transform.position, patrolRadius);
                Debug.Log($"✓ Patrol zone: spawn point, radius: {patrolRadius}m");
            }
            chaseState = new ChaseState(this, 2f, chaseRange);
            attackState = new AttackState(this, attackRange, attackDamage, attackCooldown);
            pullSkill = new PullSkill(transform, pullActivationRange, pullConeHalfAngle, pullMaxForce, pullMinForce, pullCastTime, pullDuration, pullCooldown);
            
            Debug.Log($"✓ States initialized");
            Debug.Log($"✓ PatrolOrigin: {transform.position} | Radius: {patrolRadius}m");
            Debug.Log($"✓ NavMeshAgent: {GetComponent<UnityEngine.AI.NavMeshAgent>()}");
            
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
            }
            }
            catch (System.Exception ex)
            {
                Debug.LogError($"❌ [ChangeStateType] ERROR during {newState} transition: {ex.Message}\n{ex.StackTrace}");
                currentState = null;
            }
        }

        protected override void Update()
        {
            // IMPORTANT: For Investigate state, we need to capture exit reason BEFORE base.Update() clears currentState
            if (currentStateType == OngKeStateType.Investigate && currentState != null)
            {
                InvestigateState invState = currentState as InvestigateState;
                if (invState != null && invState.ShouldExit())
                {
                    // Save exit reason before state gets cleared
                    investigateExitWasPlayerDetected = invState.WasPlayerDetected();
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
                        Debug.Log($"✅ Patrol→Chase ({dist:F1}m)");
                        ChangeStateType(OngKeStateType.Chase);
                    }
                    break;

                case OngKeStateType.Chase:
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
                        Debug.Log($"✅ Chase→Attack ({dist:F1}m)");
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
                            Debug.Log($"✅ Chase→Investigate ({lastKnownPos}) [dự đoán Phase B {chaseTimer:F1}s]");
                            ChangeStateType(OngKeStateType.Investigate, lastKnownPos);
                        }
                    }
                    // Priority 3: Player still visible but too far
                    else if (detected && dist > chaseRange)
                    {
                        Debug.Log($"✅ Chase→Patrol ({dist:F1}m > {chaseRange}m)");
                        ChangeStateType(OngKeStateType.Patrol);
                    }
                    break;

                case OngKeStateType.Attack:
                    if (!detected)
                    {
                        lastKnownPos = playerDetector.GetLastDetectedPlayerPosition();
                        Debug.Log($"✅ Attack→Investigate ({lastKnownPos})");
                        ChangeStateType(OngKeStateType.Investigate, lastKnownPos);
                    }
                    else if (dist > attackRange + 0.5f) // Hysteresis
                    {
                        Debug.Log($"✅ Attack→Chase ({dist:F1}m)");
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
                            Debug.Log($"✅ Investigate→Chase (player detected during search)");
                            ChangeStateType(OngKeStateType.Chase);
                        }
                        else
                        {
                            Debug.Log($"✅ Investigate→Patrol (timeout after 2s search)");
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

