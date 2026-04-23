using UnityEngine;
using UnityEngine.AI;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái di chuyển ngẫu nhiên trên NavMesh.
    /// Hỗ trợ 1 hoặc nhiều zone (mỗi zone là 1 điểm origin + chung 1 radius).
    /// Monster sẽ di chuyển ngẫu nhiên trong zone hiện tại, sau đó chuyển sang zone tiếp theo.
    /// </summary>
    public class RandomPatrolState : IMonsterState
    {
        private readonly MonsterBase monster;

        /// <summary>Danh sách tâm các vùng patrol</summary>
        private readonly Vector3[] patrolZones;

        /// <summary>Bán kính tối đa của mỗi zone</summary>
        private readonly float patrolRadius;

        /// <summary>Phần bán kính bị trừ ở mép zone để tránh bám sát tường/rìa collider.</summary>
        private readonly float patrolEdgePadding;

        /// <summary>Layer vật cản cần tránh khi chọn target patrol.</summary>
        private readonly LayerMask patrolObstacleMask;

        /// <summary>Khoảng cách để coi là "đến nơi"</summary>
        private readonly float arrivalThreshold;

        /// <summary>Thời gian đứng chờ khi đến điểm (giây)</summary>
        private readonly float idleTimeAtPoint;

        private Vector3 currentTarget;
        private int currentZoneIndex = 0;
        private bool hasTarget = false;
        private float idleTimer = 0f;
        private bool isIdle = false;
        private float stuckTimer = 0f;

        // Theo yêu cầu: nếu velocity < (baseSpeed - 10) trong 1.5s thì đổi patrol target.
        private const float StuckSpeedDeltaFromBase = 10f;
        private const float MinEffectiveStuckThreshold = 0.05f;
        private const float StuckRepathDelay = 1.5f;

        // ── Constructor: 1 zone (spawn point) ──────────────────────────────
        /// <param name="monster">MonsterBase của quái</param>
        /// <param name="patrolOrigin">Tâm vùng patrol duy nhất</param>
        /// <param name="patrolRadius">Bán kính vùng patrol</param>
        /// <param name="arrivalThreshold">Khoảng cách "đến nơi" (default 1.2f)</param>
        /// <param name="idleTimeAtPoint">Thời gian đứng nghỉ tại mỗi điểm (default 1.5f)</param>
        public RandomPatrolState(
            MonsterBase monster,
            Vector3 patrolOrigin,
            float patrolRadius,
            float arrivalThreshold = 1.2f,
            float idleTimeAtPoint = 1.5f,
            float patrolEdgePadding = 2f,
            LayerMask patrolObstacleMask = default)
            : this(monster, new Vector3[] { patrolOrigin }, patrolRadius, arrivalThreshold, idleTimeAtPoint, patrolEdgePadding, patrolObstacleMask) { }

        // ── Constructor: nhiều zone ─────────────────────────────────────────
        /// <param name="monster">MonsterBase của quái</param>
        /// <param name="patrolZones">Mảng các tâm zone — monster tuần tự qua từng zone</param>
        /// <param name="patrolRadius">Bán kính chung cho tất cả zone</param>
        /// <param name="arrivalThreshold">Khoảng cách "đến nơi" (default 1.2f)</param>
        /// <param name="idleTimeAtPoint">Thời gian đứng nghỉ tại mỗi điểm (default 1.5f)</param>
        public RandomPatrolState(
            MonsterBase monster,
            Vector3[] patrolZones,
            float patrolRadius,
            float arrivalThreshold = 1.2f,
            float idleTimeAtPoint = 1.5f,
            float patrolEdgePadding = 2f,
            LayerMask patrolObstacleMask = default)
        {
            this.monster = monster;
            this.patrolZones = patrolZones != null && patrolZones.Length > 0
                ? patrolZones
                : new Vector3[] { monster.transform.position };
            this.patrolRadius = patrolRadius;
            this.arrivalThreshold = arrivalThreshold;
            this.idleTimeAtPoint = idleTimeAtPoint;
            this.patrolEdgePadding = Mathf.Max(0f, patrolEdgePadding);
            this.patrolObstacleMask = patrolObstacleMask == default
                ? LayerMask.GetMask("Wall", "Boundary")
                : patrolObstacleMask;
        }

        public void Enter()
        {
            hasTarget = false;
            isIdle = false;
            idleTimer = 0f;
            stuckTimer = 0f;
            currentZoneIndex = 0;

            NavMeshAgent agent = monster.GetNavMeshAgent();
            if (agent != null)
            {
                float stuckThreshold = Mathf.Max(MinEffectiveStuckThreshold, agent.speed - StuckSpeedDeltaFromBase);
                Debug.Log($"[RandomPatrol] baseSpeed={agent.speed:F2} | stuckThreshold(base-10)={stuckThreshold:F2} | stuckDelay={StuckRepathDelay:F1}s");
            }

            PickNewTarget();
            Debug.Log($"[RandomPatrol] Enter → zone[{currentZoneIndex}] target: {currentTarget}");
        }

        public void Update()
        {
            if (isIdle)
            {
                // Đang đứng nghỉ — đếm thời gian rồi chuyển zone tiếp theo
                idleTimer += Time.deltaTime;
                if (idleTimer >= idleTimeAtPoint)
                {
                    isIdle = false;
                    // Chọn zone ngẫu nhiên (tránh lặp lại zone vừa đứng)
                    if (patrolZones.Length > 1)
                    {
                        int newZone;
                        do { newZone = Random.Range(0, patrolZones.Length); }
                        while (newZone == currentZoneIndex);
                        currentZoneIndex = newZone;
                    }
                    PickNewTarget();
                }
                return;
            }

            if (!hasTarget)
            {
                PickNewTarget();
                return;
            }

            monster.MoveTo(currentTarget);

            float dist = Vector3.Distance(monster.transform.position, currentTarget);

            // ===== Check obstacle ahead (raycast 1.5m) =====
            Vector3 dirToTarget = (currentTarget - monster.transform.position).normalized;
            if (CheckObstacleAhead(dirToTarget, 1.5f))
            {
                Debug.LogWarning($"[RandomPatrol] ⚠️ OBSTACLE AHEAD! Đổi patrol point ngay. (dist to target={dist:F2}m)");
                hasTarget = false;
                stuckTimer = 0f;
                monster.Stop();
                return;
            }

            // Nếu đích bị chặn bởi collider vật lý (không phản ánh trên NavMesh),
            // agent sẽ gần như đứng yên dù còn xa đích. Khi đó đổi target mới.
            if (dist > arrivalThreshold)
            {
                NavMeshAgent agent = monster.GetNavMeshAgent();
                if (agent != null && !agent.pathPending)
                {
                    float stuckSpeedThreshold = Mathf.Max(MinEffectiveStuckThreshold, agent.speed - StuckSpeedDeltaFromBase);
                    if (agent.velocity.sqrMagnitude <= stuckSpeedThreshold * stuckSpeedThreshold)
                    {
                        stuckTimer += Time.deltaTime;
                        if (stuckTimer >= StuckRepathDelay)
                        {
                            Debug.LogWarning($"[RandomPatrol] Có vẻ bị kẹt tại target {currentTarget} (dist={dist:F2}). Đổi target mới.");
                            hasTarget = false;
                            stuckTimer = 0f;
                            monster.Stop();
                            return;
                        }
                    }
                    else
                    {
                        stuckTimer = 0f;
                    }
                }
            }
            else
            {
                stuckTimer = 0f;
            }

            if (dist <= arrivalThreshold)
            {
                // Đến nơi → bắt đầu idle
                monster.Stop();
                isIdle = true;
                idleTimer = 0f;
                Debug.Log($"[RandomPatrol] Đến điểm {currentTarget}, idle {idleTimeAtPoint}s");
            }

            // Hướng model
            if (monster.IsPlayerDetected())
                monster.LookAtPlayer();
            else
                monster.LookForward();

            // Cập nhật detection cone
            NavMeshAgent detectorAgent = monster.GetNavMeshAgent();
            if (detectorAgent != null && detectorAgent.velocity.sqrMagnitude > 0.01f)
                monster.GetPlayerDetector().UpdateDetectionDirection(detectorAgent.velocity.normalized);

            // Debug line
            Debug.DrawLine(monster.transform.position, currentTarget, Color.cyan);
        }

        public void Exit()
        {
            stuckTimer = 0f;
            monster.Stop();
        }

        public bool ShouldExit()
        {
            // RandomPatrolState luôn chạy — controller bên ngoài quyết định chuyển state
            return false;
        }

        // ──────────────────────────────────────────────
        // Private helpers
        // ──────────────────────────────────────────────

        /// <summary>
        /// Tìm điểm ngẫu nhiên hợp lệ trên NavMesh trong zone hiện tại.
        /// Validation chain: NavMeshSample → CanReachDestination → PhysicalClearance → ActualPathTest
        /// Thử tối đa 50 lần, nếu không được thì fallback.
        /// </summary>
        private void PickNewTarget()
        {
            const int maxAttempts = 50;
            Vector3 zoneCenter = patrolZones[currentZoneIndex];
            float effectiveRadius = Mathf.Max(1f, patrolRadius - patrolEdgePadding);
            
            NavMeshAgent agent = monster.GetNavMeshAgent();
            if (agent == null)
            {
                Debug.LogError("[RandomPatrol] ❌ NavMeshAgent not found!");
                currentTarget = zoneCenter;
                hasTarget = true;
                return;
            }

            // ✅ Validation chain - tối đa 50 attempts
            for (int i = 0; i < maxAttempts; i++)
            {
                Vector3 randomOffset = Random.insideUnitSphere * effectiveRadius;
                randomOffset.y = 0f;
                Vector3 candidate = zoneCenter + randomOffset;

                // [1] NavMesh.SamplePosition
                if (!NavMesh.SamplePosition(candidate, out NavMeshHit hit, effectiveRadius, NavMesh.AllAreas))
                {
                    //Debug.Log($"[RandomPatrol] Attempt {i + 1}: ❌ NavMesh.SamplePosition failed");
                    continue;
                }

                // [2] CanReachDestination  
                if (!monster.CanReachDestination(hit.position, Mathf.Max(1f, effectiveRadius * 0.5f)))
                {
                    //Debug.Log($"[RandomPatrol] Attempt {i + 1}: ❌ CanReachDestination failed @ {hit.position}");
                    continue;
                }

                // [3] HasPhysicalClearance
                if (!HasPhysicalClearance(hit.position, agent))
                {
                    //Debug.Log($"[RandomPatrol] Attempt {i + 1}: ❌ HasPhysicalClearance blocked @ {hit.position}");
                    continue;
                }

                // [4] IsValidPatrolTarget - actual path test
                if (!IsValidPatrolTarget(agent, hit.position))
                {
                    //Debug.Log($"[RandomPatrol] Attempt {i + 1}: ❌ IsValidPatrolTarget failed @ {hit.position}");
                    continue;
                }

                // ✅ ALL CHECKS PASSED
                currentTarget = hit.position;
                hasTarget = true;
                stuckTimer = 0f;
                monster.MoveTo(currentTarget);
                Debug.Log($"[RandomPatrol] ✅ Zone[{currentZoneIndex}] target acquired @ {currentTarget:F2} (attempt {i + 1}/{maxAttempts})");
                return;
            }

            // ❌ Fallback 1: thử về gần tâm zone nhưng vẫn phải reachable
            if (monster.TryGetReachableDestination(zoneCenter, out Vector3 fallbackPoint, Mathf.Max(1f, effectiveRadius))
                && HasPhysicalClearance(fallbackPoint, agent)
                && IsValidPatrolTarget(agent, fallbackPoint))
            {
                currentTarget = fallbackPoint;
                hasTarget = true;
                stuckTimer = 0f;
                monster.MoveTo(currentTarget);
                Debug.LogWarning($"[RandomPatrol] ⚠️ Fallback 1 reachable về zone[{currentZoneIndex}] @ {fallbackPoint:F2}");
                return;
            }

            // ❌ Fallback 2: tâm zone (cuối cùng)
            currentTarget = zoneCenter;
            hasTarget = true;
            stuckTimer = 0f;
            monster.MoveTo(currentTarget);
            Debug.LogWarning($"[RandomPatrol] ⚠️ Fallback 2 cuối về tâm zone[{currentZoneIndex}] @ {zoneCenter:F2}");
        }

        private bool HasPhysicalClearance(Vector3 point, NavMeshAgent agent)
        {
            if (agent == null)
                return true;

            float agentRadius = Mathf.Max(0.25f, agent.radius * 0.9f);
            float capsuleBottom = Mathf.Max(0.1f, agent.height * 0.25f);
            float capsuleTop = Mathf.Max(capsuleBottom + 0.1f, agent.height * 0.9f);

            Vector3 bottom = point + Vector3.up * capsuleBottom;
            Vector3 top = point + Vector3.up * capsuleTop;

            bool blocked = Physics.CheckCapsule(
                bottom,
                top,
                agentRadius,
                patrolObstacleMask,
                QueryTriggerInteraction.Ignore);

            return !blocked;
        }

        /// <summary>
        /// Raycast từ monster hướng target, check nếu có obstacle trong 1.5m
        /// </summary>
        private bool CheckObstacleAhead(Vector3 direction, float distance = 1.5f)
        {
            if (monster == null)
                return false;

            RaycastHit hit;
            bool hasObstacle = Physics.Raycast(
                monster.transform.position + Vector3.up * 1f,
                direction.normalized,
                out hit,
                distance,
                patrolObstacleMask,
                QueryTriggerInteraction.Ignore);

            return hasObstacle;
        }

        /// <summary>
        /// Test actual path từ monster position tới target
        /// Checks:
        ///   ✅ Path calculated successfully
        ///   ✅ path.status == NavMeshPathStatus.PathComplete (not partial/invalid)
        ///   ✅ Path có ít nhất 2 corners (start + end)
        /// </summary>
        private bool IsValidPatrolTarget(NavMeshAgent agent, Vector3 targetPos)
        {
            if (agent == null)
                return true;

            NavMeshPath path = new NavMeshPath();
            
            // [1] Calculate actual path từ agent position tới target
            bool pathCalculated = agent.CalculatePath(targetPos, path);
            if (!pathCalculated)
            {
                //Debug.Log($"[RandomPatrol] Path calculation FAILED for target {targetPos}");
                return false;
            }

            // [2] Check path status - MUST be PathComplete
            if (path.status != NavMeshPathStatus.PathComplete)
            {
                //Debug.Log($"[RandomPatrol] Path status {path.status} != PathComplete (target {targetPos})");
                return false;
            }

            // [3] Check corners count - MUST have at least 2 (start + end)
            if (path.corners.Length < 2)
            {
                //Debug.Log($"[RandomPatrol] Path has only {path.corners.Length} corners (need ≥2) for target {targetPos}");
                return false;
            }

            // ✅ All checks passed
            return true;
        }
    }
}
