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

        /// <summary>Khoảng cách để coi là "đến nơi"</summary>
        private readonly float arrivalThreshold;

        /// <summary>Thời gian đứng chờ khi đến điểm (giây)</summary>
        private readonly float idleTimeAtPoint;

        private Vector3 currentTarget;
        private int currentZoneIndex = 0;
        private bool hasTarget = false;
        private float idleTimer = 0f;
        private bool isIdle = false;

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
            float idleTimeAtPoint = 1.5f)
            : this(monster, new Vector3[] { patrolOrigin }, patrolRadius, arrivalThreshold, idleTimeAtPoint) { }

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
            float idleTimeAtPoint = 1.5f)
        {
            this.monster = monster;
            this.patrolZones = patrolZones != null && patrolZones.Length > 0
                ? patrolZones
                : new Vector3[] { monster.transform.position };
            this.patrolRadius = patrolRadius;
            this.arrivalThreshold = arrivalThreshold;
            this.idleTimeAtPoint = idleTimeAtPoint;
        }

        public void Enter()
        {
            hasTarget = false;
            isIdle = false;
            idleTimer = 0f;
            currentZoneIndex = 0;
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
            NavMeshAgent agent = monster.GetNavMeshAgent();
            if (agent != null && agent.velocity.sqrMagnitude > 0.01f)
                monster.GetPlayerDetector().UpdateDetectionDirection(agent.velocity.normalized);

            // Debug line
            Debug.DrawLine(monster.transform.position, currentTarget, Color.cyan);
        }

        public void Exit()
        {
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
        /// Thử tối đa 10 lần, nếu không được thì quay về tâm zone đó.
        /// </summary>
        private void PickNewTarget()
        {
            const int maxAttempts = 10;
            Vector3 zoneCenter = patrolZones[currentZoneIndex];

            for (int i = 0; i < maxAttempts; i++)
            {
                Vector3 randomOffset = Random.insideUnitSphere * patrolRadius;
                randomOffset.y = 0f;
                Vector3 candidate = zoneCenter + randomOffset;

                if (NavMesh.SamplePosition(candidate, out NavMeshHit hit, patrolRadius, NavMesh.AllAreas))
                {
                    currentTarget = hit.position;
                    hasTarget = true;
                    monster.MoveTo(currentTarget);
                    Debug.Log($"[RandomPatrol] Zone[{currentZoneIndex}] target: {currentTarget} (attempt {i + 1})");
                    return;
                }
            }

            // Fallback: về tâm zone
            currentTarget = zoneCenter;
            hasTarget = true;
            monster.MoveTo(currentTarget);
            Debug.LogWarning($"[RandomPatrol] Fallback về tâm zone[{currentZoneIndex}]: {zoneCenter}");
        }
    }
}
