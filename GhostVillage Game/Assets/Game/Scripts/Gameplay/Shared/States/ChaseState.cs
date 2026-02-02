using UnityEngine;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái đuổi theo player
    /// Lưu ý: Khi mất player, sẽ tiếp tục biết vị trí trong 2 giây
    /// </summary>
    public class ChaseState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float chaseStopDistance; // Khoảng cách để thoát chase state
        private readonly float chaseLoseRange; // Khoảng cách để mất player
        private readonly float lastSeenDuration = 2f; // Thời gian nhớ vị trí cuối (2s)

        private Vector3 lastSeenPlayerPos = Vector3.zero;
        private float lastSeenTime = 0f;
        private bool hasLostSight = false; // Để track lần đầu mất player

        public ChaseState(MonsterBase monster, float chaseStopDistance = 2f, float chaseLoseRange = 25f)
        {
            this.monster = monster;
            this.chaseStopDistance = chaseStopDistance;
            this.chaseLoseRange = chaseLoseRange;
        }

        public void Enter()
        {
            Debug.Log("🔴 ChaseState: Bắt đầu đuổi player!");
            hasLostSight = false;
            lastSeenTime = 0f;
        }

        public void Update()
        {
            // Nếu vẫn detect player
            if (monster.IsPlayerDetected())
            {
                // Cập nhật vị trí cuối cùng
                lastSeenPlayerPos = monster.GetPlayerPosition();
                lastSeenTime = Time.time;
                hasLostSight = false;

                // Di chuyển về phía player
                monster.MoveTo(lastSeenPlayerPos);
                monster.LookAtPlayer();
            }
            else
            {
                // Mất player rồi
                if (!hasLostSight)
                {
                    // Lần đầu mất player
                    lastSeenPlayerPos = monster.GetPlayerPosition();
                    lastSeenTime = Time.time;
                    hasLostSight = true;
                    Debug.Log($"🔴 ChaseState: Mất player! Vị trí cuối: {lastSeenPlayerPos}");
                }

                // Kiểm tra còn trong timeout không (2 giây)
                float timeSinceLostSight = Time.time - lastSeenTime;
                if (timeSinceLostSight < lastSeenDuration)
                {
                    // Vẫn còn trong 2 giây - tiếp tục chạy tới vị trí cuối
                    monster.MoveTo(lastSeenPlayerPos);
                    
                    // Nhìn về hướng player cuối cùng
                    Vector3 directionToLastPos = lastSeenPlayerPos - monster.transform.position;
                    if (directionToLastPos.sqrMagnitude > 0.01f)
                    {
                        Quaternion targetRot = Quaternion.LookRotation(directionToLastPos.normalized);
                        monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, targetRot, Time.deltaTime * 5f);
                    }

                    Debug.Log($"🔴 ChaseState: Chạy tới vị trí cuối ({timeSinceLostSight:F1}s / {lastSeenDuration}s)");
                }
                else
                {
                    // Hết timeout - thoát Chase
                    Debug.Log($"🔴 ChaseState: Hết timeout, thoát!");
                    monster.Stop();
                }
            }
        }

        public void Exit()
        {
            Debug.Log("🟢 ChaseState: Dừng đuổi!");
            monster.Stop();
        }

        public bool ShouldExit()
        {
            // Thoát chase nếu:
            // 1. Hết timeout (> 2s) sau khi mất player
            if (hasLostSight && (Time.time - lastSeenTime) >= lastSeenDuration)
            {
                return true;
            }

            // 2. Player quá xa (ngoài range)
            if (monster.IsPlayerDetected())
            {
                float distanceToPlayer = Vector3.Distance(monster.transform.position, monster.GetPlayerPosition());
                if (distanceToPlayer > chaseLoseRange)
                {
                    Debug.Log($"🟠 ChaseState: Player quá xa ({distanceToPlayer:F1}m > {chaseLoseRange}m)!");
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Lấy vị trí cuối cùng mà player được detect
        /// </summary>
        public Vector3 GetLastSeenPlayerPosition()
        {
            return lastSeenPlayerPos;
        }

        /// <summary>
        /// Kiểm tra xem đã mất player chưa (để transition sang Investigate)
        /// </summary>
        public bool HasLostPlayer()
        {
            return hasLostSight;
        }
    }
}
