using UnityEngine;
using UnityEngine.AI;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái chạy NGƯỢC hướng player trong một khoảng thời gian.
    /// Dùng cho Vòng Nhi sau khi báo động xong.
    /// </summary>
    public class FleeState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float fleeDuration;     // Thời gian chạy trốn (giây)
        private readonly float fleeDistance;     // Khoảng cách chạy mỗi lần update mục tiêu
        private readonly float updateInterval;   // Cập nhật điểm chạy trốn mỗi N giây

        private float elapsedTime = 0f;
        private float nextUpdateTime = 0f;

        public FleeState(MonsterBase monster, float fleeDuration = 8f,
                         float fleeDistance = 15f, float updateInterval = 2f)
        {
            this.monster      = monster;
            this.fleeDuration = fleeDuration;
            this.fleeDistance = fleeDistance;
            this.updateInterval = updateInterval;
        }

        public void Enter()
        {
            elapsedTime    = 0f;
            nextUpdateTime = 0f;
            Debug.Log("FleeState: Bắt đầu chạy trốn!");
            UpdateFleeDestination();
        }

        public void Update()
        {
            elapsedTime    += Time.deltaTime;
            nextUpdateTime -= Time.deltaTime;

            // Cập nhật điểm đích định kỳ (player di chuyển nên hướng trốn thay đổi)
            if (nextUpdateTime <= 0f)
                UpdateFleeDestination();
        }

        public bool ShouldExit() => elapsedTime >= fleeDuration;

        public void Exit()
        {
            Debug.Log("FleeState: Hết thời gian chạy trốn.");
        }

        // ─────────────────────────────────────────────────────────
        // Tính điểm chạy: ngược hướng player, sample NavMesh
        // ─────────────────────────────────────────────────────────
        private void UpdateFleeDestination()
        {
            nextUpdateTime = updateInterval;

            Vector3 playerPos  = monster.GetPlayerPosition();
            Vector3 monsterPos = monster.transform.position;

            // Hướng chạy = ngược chiều player
            Vector3 fleeDir = (monsterPos - playerPos).normalized;

            // Nếu không có player (GetPlayerPosition trả về zero), chạy ngẫu nhiên
            if (fleeDir.sqrMagnitude < 0.01f)
                fleeDir = Random.insideUnitSphere.normalized;
            fleeDir.y = 0f;

            Vector3 fleeTarget = monsterPos + fleeDir * fleeDistance;

            // Sample lên NavMesh để chắc chắn điểm đến hợp lệ
            if (NavMesh.SamplePosition(fleeTarget, out NavMeshHit hit, fleeDistance, NavMesh.AllAreas))
                monster.MoveTo(hit.position);
            else
                monster.MoveTo(fleeTarget); // Fallback nếu không tìm được điểm NavMesh
        }
    }
}
