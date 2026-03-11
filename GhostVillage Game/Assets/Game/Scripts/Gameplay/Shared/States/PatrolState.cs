using UnityEngine;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái di chuyển theo các waypoint (patrol)
    /// </summary>
    public class PatrolState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly Vector3[] waypoints;
        private int currentWaypointIndex = 0;

        public PatrolState(MonsterBase monster, Vector3[] waypoints)
        {
            this.monster = monster;
            this.waypoints = waypoints;
        }

        public void Enter()
        {
            if (waypoints == null || waypoints.Length == 0)
            {
                Debug.LogError("PatrolState: Không có waypoint nào được cấu hình!");     
                return;
            }

            // Reset waypoint index khi vào lại (từ ChaseState hoặc state khác)
            currentWaypointIndex = 0;
            GoToNextWaypoint();
            
            Debug.Log("✅ PatrolState: Bắt đầu patrol!");
        }

        public void Update()
        {
            // Luôn di chuyển theo waypoint hiện tại
            Vector3 targetWaypoint = waypoints[currentWaypointIndex];
            float distanceToWaypoint = Vector3.Distance(monster.transform.position, targetWaypoint);

            // Luôn gọi MoveTo mỗi frame để giữ NavMeshAgent active
            monster.MoveTo(targetWaypoint);

            // Kiểm tra xem đã tới waypoint chưa
            if (distanceToWaypoint < 1f)
            {
                Debug.Log($"📍 PatrolState: Đã đến waypoint {currentWaypointIndex}. Chuyển sang waypoint {(currentWaypointIndex + 1) % waypoints.Length}");
                
                // Chuyển sang waypoint tiếp theo
                currentWaypointIndex = (currentWaypointIndex + 1) % waypoints.Length;
            }

            // Debug: show current target
            Debug.DrawLine(monster.transform.position, targetWaypoint, Color.cyan);

            // Nếu detect player thì nhìn về player, không thì quay theo hướng di chuyển
            if (monster.IsPlayerDetected())
            {
                monster.LookAtPlayer();
            }
            else
            {
                monster.LookForward();
            }

            // QUAN TRỌNG: Cập nhật detection cone để xoay cùng với model
            // Lấy hướng di chuyển từ NavMeshAgent velocity
            if (monster.GetNavMeshAgent() != null && monster.GetNavMeshAgent().velocity.sqrMagnitude > 0.01f)
            {
                monster.GetPlayerDetector().UpdateDetectionDirection(monster.GetNavMeshAgent().velocity.normalized);
            }
        }

        public void Exit()
        {
            monster.Stop();
        }

        public bool ShouldExit()
        {
            // PatrolState luôn chạy trừ khi có state khác can thiệp (Chase, Attack, v.v.)
            return false;
        }

        /// <summary>
        /// Di chuyển đến waypoint hiện tại
        /// </summary>
        private void GoToNextWaypoint()
        {
            if (waypoints.Length == 0)
            {
                Debug.LogError("PatrolState: Không có waypoint!");
                return;
            }

            Vector3 targetWaypoint = waypoints[currentWaypointIndex];
            Debug.Log($"📍 PatrolState: Di chuyển đến waypoint[{currentWaypointIndex}] = {targetWaypoint}");
            
            monster.MoveTo(targetWaypoint);
        }


    }
}
