using UnityEngine;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái điều tra vị trí cuối cùng mà player được detect
    /// Sẽ quay hướng xung quanh để tìm player
    /// </summary>
    public class InvestigateState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float investigateWaitTime = 3f;

        private Vector3 investigatePosition = Vector3.zero;
        private float elapsedTime = 0f; // Track elapsed time during investigation
        private float lastMoveLog = 0f;
        private float lastRotationLog = 0f;
        private float searchPhaseStartTime = 0f; // Khi nào bắt đầu phase tìm kiếm
        private bool isSearching = false; // Đã tới vị trí, bắt đầu tìm kiếm
        private bool playerDetectedDuringSearch = false; // Track if player was detected during search

        public InvestigateState(MonsterBase monster, Vector3 lastPlayerPosition)
        {
            this.monster = monster;
            this.investigatePosition = lastPlayerPosition;
            this.elapsedTime = 0f;
            this.isSearching = false;
        }

        public void Enter()
        {
            Debug.Log($"🟡 InvestigateState: Dự đoán được vị trí {investigatePosition}, di chuyển đến đó để tìm kiếm");
            elapsedTime = 0f;
            searchPhaseStartTime = 0f;
            isSearching = false;
            playerDetectedDuringSearch = false;
            monster.MoveTo(investigatePosition);
        }

        public void Update()
        {
            elapsedTime += Time.deltaTime;

            // PHASE 1: Di chuyển tới vị trí
            if (!isSearching)
            {
                float distanceToTarget = Vector3.Distance(monster.transform.position, investigatePosition);
                
                if (elapsedTime - lastMoveLog > 1f)
                {
                    Debug.Log($"🚶 InvestigateState: Di chuyển... Còn {distanceToTarget:F1}m");
                    lastMoveLog = elapsedTime;
                }
                
                // Check if NavMeshAgent has reached destination OR distance is close enough
                bool hasReachedDestination = false;
                var navMeshAgent = monster.GetComponent<UnityEngine.AI.NavMeshAgent>();
                if (navMeshAgent != null && navMeshAgent.hasPath)
                {
                    hasReachedDestination = !navMeshAgent.hasPath || navMeshAgent.remainingDistance <= navMeshAgent.stoppingDistance;
                    if (navMeshAgent.hasPath && !navMeshAgent.pathPending)
                    {
                        hasReachedDestination = navMeshAgent.remainingDistance <= 0.5f;
                    }
                }
                else
                {
                    // Fallback to distance check if NavMeshAgent not available
                    hasReachedDestination = distanceToTarget <= 0.5f;
                }
                
                if (!hasReachedDestination && distanceToTarget > 0.5f)
                {
                    // Vẫn di chuyển, không quay
                    monster.MoveTo(investigatePosition);
                }
                else
                {
                    // Đã tới - bắt đầu phase tìm kiếm
                    isSearching = true;
                    searchPhaseStartTime = elapsedTime;
                    Debug.Log($" InvestigateState: Đã tới vị trí, bắt đầu tìm kiếm!");
                }
            }

            // PHASE 2: Tìm kiếm (xoay tới xoay lui pattern)
            if (isSearching)
            {
                float searchElapsed = elapsedTime - searchPhaseStartTime;
                
                // Search pattern: -90° → 0° → +90° → 0° (left → center → right → center)
                // Mỗi phase 0.5s
                float patternCycle = 2f; // Một vòng tìm (left-center-right-center) = 2s
                float normalizedTime = (searchElapsed % patternCycle) / patternCycle; // 0 to 1
                
                float targetAngle;
                if (normalizedTime < 0.33f)
                {
                    // Phase 1: -90° → 0° (0-0.33s)
                    targetAngle = Mathf.Lerp(-90f, 0f, normalizedTime / 0.33f);
                }
                else if (normalizedTime < 0.67f)
                {
                    // Phase 2: 0° → +90° (0.33-0.67s)
                    targetAngle = Mathf.Lerp(0f, 90f, (normalizedTime - 0.33f) / 0.34f);
                }
                else
                {
                    // Phase 3: +90° → 0° (0.67-1s)
                    targetAngle = Mathf.Lerp(90f, 0f, (normalizedTime - 0.67f) / 0.33f);
                }
                
                // Log mỗi 0.5s
                if (searchElapsed - lastRotationLog > 0.5f)
                {
                    Debug.Log($"🔍 InvestigateState: Tìm kiếm... Góc: {targetAngle:F0}° ({searchElapsed:F1}s)");
                    lastRotationLog = searchElapsed;
                }
                
                // Tính hướng nhìn dựa trên góc
                Vector3 lookDirection = new Vector3(
                    Mathf.Sin(Mathf.Deg2Rad * targetAngle),
                    0f,
                    Mathf.Cos(Mathf.Deg2Rad * targetAngle)
                );
                
                // Quay nhìn theo hướng đó
                if (lookDirection != Vector3.zero)
                {
                    Quaternion lookRotation = Quaternion.LookRotation(lookDirection);
                    monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, lookRotation, 0.1f);
                }
            }
        }

        public void Exit()
        {
            Debug.Log("⚪ InvestigateState: Kết thúc điều tra!");
            monster.Stop();
        }

        public bool ShouldExit()
        {
            // Nếu chưa tới vị trí, không thoát
            if (!isSearching) return false;
            
            float searchElapsed = elapsedTime - searchPhaseStartTime;
            
            // Thoát nếu hết thời gian tìm kiếm (2s)
            if (searchElapsed >= investigateWaitTime)
            {
                Debug.Log($"⚪ InvestigateState: Hết thời gian tìm kiếm, quay lại Patrol!");
                return true;
            }

            // Nếu detect player trong lúc tìm kiếm - quay lại Chase
            if (monster.IsPlayerDetected())
            {
                playerDetectedDuringSearch = true;
                Debug.Log($"🔴 InvestigateState: Lại thấy player! Quay lại Chase!");
                return true;
            }

            return false;
        }

        // Debug helpers
        public float GetElapsedTime() => elapsedTime;
        public bool IsSearching() => isSearching;
        public bool WasPlayerDetected() => playerDetectedDuringSearch;
    }
}
