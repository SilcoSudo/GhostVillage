using UnityEngine;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái chạy tới vị trí tiếng sáo (item sáo) để tìm player
    /// Tương tự Investigate nhưng với hành động tích cực là chạy thẳng đến, không chỉ xoay
    /// </summary>
    public class SirenState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float sirenSearchDuration = 4f; // Thời gian lùng sục tại vị trí tiếng sáo

        private Vector3 sirenPosition = Vector3.zero;
        private float elapsedTime = 0f;
        private float lastMoveLog = 0f;
        private float lastRotationLog = 0f;
        private float searchPhaseStartTime = 0f;
        private bool hasReachedPosition = false;
        private bool playerDetectedDuringSiren = false;

        public SirenState(MonsterBase monster, Vector3 sirenLocation = default)
        {
            this.monster = monster;
            this.sirenPosition = sirenLocation != Vector3.zero ? sirenLocation : monster.transform.position;
            this.elapsedTime = 0f;
            this.hasReachedPosition = false;
        }

        public void Enter()
        {
            Debug.Log($"🔊 SirenState: Nghe thấy tiếng sáo tại {sirenPosition}, chạy tới đó!");
            elapsedTime = 0f;
            searchPhaseStartTime = 0f;
            hasReachedPosition = false;
            playerDetectedDuringSiren = false;
            monster.MoveTo(sirenPosition);
        }

        public void Update()
        {
            elapsedTime += Time.deltaTime;

            // PHASE 1: Chạy tới vị trí
            if (!hasReachedPosition)
            {
                float distanceToTarget = Vector3.Distance(monster.transform.position, sirenPosition);
                
                if (elapsedTime - lastMoveLog > 1f)
                {
                    Debug.Log($"🏃 SirenState: Chạy tới... Còn {distanceToTarget:F1}m");
                    lastMoveLog = elapsedTime;
                }
                
                // Kiểm tra đã tới vị trí chưa
                bool hasReached = false;
                var navMeshAgent = monster.GetComponent<UnityEngine.AI.NavMeshAgent>();
                if (navMeshAgent != null && navMeshAgent.hasPath)
                {
                    hasReached = !navMeshAgent.hasPath || navMeshAgent.remainingDistance <= navMeshAgent.stoppingDistance;
                    if (navMeshAgent.hasPath && !navMeshAgent.pathPending)
                    {
                        hasReached = navMeshAgent.remainingDistance <= 0.5f;
                    }
                }
                else
                {
                    hasReached = distanceToTarget <= 0.5f;
                }
                
                if (hasReached || distanceToTarget <= 0.5f)
                {
                    // Đã tới - bắt đầu phase tìm kiếm
                    hasReachedPosition = true;
                    searchPhaseStartTime = elapsedTime;
                    Debug.Log($"🔊 SirenState: Đã tới vị trí tiếng sáo, bắt đầu lùng sục!");
                }
                else
                {
                    // Vẫn chạy tới, nhìn theo hướng đích
                    Vector3 directionToTarget = (sirenPosition - monster.transform.position).normalized;
                    if (directionToTarget.sqrMagnitude > 0.01f)
                    {
                        Quaternion targetRot = Quaternion.LookRotation(directionToTarget);
                        monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, targetRot, Time.deltaTime * 5f);
                    }
                }
            }

            // PHASE 2: Lùng sục xung quanh vị trí (xoay tới xoay lui)
            if (hasReachedPosition)
            {
                float searchElapsed = elapsedTime - searchPhaseStartTime;
                
                // Search pattern: -90° → 0° → +90° → 0° (left → center → right → center)
                float patternCycle = 2f;
                float normalizedTime = (searchElapsed % patternCycle) / patternCycle;
                
                float targetAngle;
                if (normalizedTime < 0.33f)
                {
                    targetAngle = Mathf.Lerp(-90f, 0f, normalizedTime / 0.33f);
                }
                else if (normalizedTime < 0.67f)
                {
                    targetAngle = Mathf.Lerp(0f, 90f, (normalizedTime - 0.33f) / 0.34f);
                }
                else
                {
                    targetAngle = Mathf.Lerp(90f, 0f, (normalizedTime - 0.67f) / 0.33f);
                }
                
                if (searchElapsed - lastRotationLog > 0.5f)
                {
                    Debug.Log($"🔊 SirenState: Lùng sục... Góc: {targetAngle:F0}° ({searchElapsed:F1}s)");
                    lastRotationLog = searchElapsed;
                }
                
                Vector3 lookDirection = new Vector3(
                    Mathf.Sin(Mathf.Deg2Rad * targetAngle),
                    0f,
                    Mathf.Cos(Mathf.Deg2Rad * targetAngle)
                );
                
                if (lookDirection != Vector3.zero)
                {
                    Quaternion lookRotation = Quaternion.LookRotation(lookDirection);
                    monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, lookRotation, 0.1f);
                }

                // Kiểm tra xem có phát hiện player không
                if (monster.IsPlayerDetected())
                {
                    playerDetectedDuringSiren = true;
                    Debug.Log($"🔴 SirenState: Phát hiện player tại vị trí sáo! Quay lại Chase!");
                }
            }
        }

        public void Exit()
        {
            Debug.Log("⚪ SirenState: Kết thúc lùng sục tiếng sáo!");
            monster.Stop();
        }

        public bool ShouldExit()
        {
            // Nếu chưa tới vị trí, không thoát
            if (!hasReachedPosition) return false;
            
            float searchElapsed = elapsedTime - searchPhaseStartTime;
            
            // Thoát nếu detect player
            if (playerDetectedDuringSiren)
            {
                return true;
            }
            
            // Thoát nếu hết thời gian lùng sục
            if (searchElapsed >= sirenSearchDuration)
            {
                Debug.Log($"⚪ SirenState: Hết thời gian lùng sục, quay lại Patrol!");
                return true;
            }

            return false;
        }

        public bool WasPlayerDetected() => playerDetectedDuringSiren;
    }
}
