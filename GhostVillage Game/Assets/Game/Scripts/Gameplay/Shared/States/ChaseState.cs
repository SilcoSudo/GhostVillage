using UnityEngine;
using GhostVillage.Gameplay.Base;
using Photon.Pun;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái đuổi theo player
    /// Lưu ý: Khi mất player, sẽ tiếp tục biết vị trí trong 2 giây (lấy từ NavMesh)
    /// </summary>
    public class ChaseState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float chaseStopDistance; // Khoảng cách để thoát chase state
        private readonly float chaseLoseRange; // Khoảng cách để mất player
        private readonly float lastSeenDuration = 5f; // Thời gian nhớ vị trí cuối (3s dự đoán hành động player)

        private Vector3 lastSeenPlayerPos = Vector3.zero;
        private float lastSeenTime = 0f;
        private bool hasLostSight = false; // Để track lần đầu mất player
        private float lastLogTime = 0f; // Để log mỗi 0.5s thay vì mỗi frame
        private int _currentTargetActorNr = -1;
        private float _chaseStartTime = 0f;

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

            // Reset và bấm giờ
            _currentTargetActorNr = -1;
            _chaseStartTime = Time.time;

            if (monster != null && monster.IsPlayerDetected())
            {
                // Tìm xem thằng nào đang bị rượt để đánh dấu
                Vector3 targetPos = monster.GetPlayerPosition();
                Collider[] hits = Physics.OverlapSphere(targetPos, 2f);

                foreach (var hit in hits)
                {
                    if (hit.CompareTag("Player"))
                    {
                        Photon.Pun.PhotonView pv = hit.GetComponentInParent<Photon.Pun.PhotonView>();
                        if (pv != null)
                        {
                            _currentTargetActorNr = pv.OwnerActorNr; // Ghi nhớ ID nạn nhân
                            Debug.Log($"<color=red>[Baiter Tracker]</color> Quái bắt đầu lock mục tiêu vào Player {_currentTargetActorNr}");
                            break;
                        }
                    }
                }
            }
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

                // 🔴 Cập nhật detection cone để xoay cùng với model
                if (monster.GetNavMeshAgent() != null && monster.GetNavMeshAgent().velocity.sqrMagnitude > 0.01f)
                {
                    monster.GetPlayerDetector().UpdateDetectionDirection(monster.GetNavMeshAgent().velocity.normalized);
                }
            }
            else
            {
                // Mất sight
                if (!hasLostSight)
                {
                    // Lần đầu mất sight - lưu vị trí lúc mất
                    lastSeenPlayerPos = monster.GetPlayerPosition();
                    lastSeenTime = Time.time;
                    lastLogTime = Time.time;
                    hasLostSight = true;
                    //Debug.Log($"🔴 ChaseState: Mất sight! Vị trí cuối: {lastSeenPlayerPos}");
                }

                // Kiểm tra còn trong timeout không (2 giây)
                float timeSinceLostSight = Time.time - lastSeenTime;
                if (timeSinceLostSight < lastSeenDuration)
                {
                    // Vẫn còn trong 2 giây - cập nhật vị trí từ NavMesh liên tục
                    // NavMesh luôn biết vị trí player, nên lấy từ đó
                    Vector3 currentPlayerPos = monster.GetPlayerPosition();
                    monster.MoveTo(currentPlayerPos);

                    // Nhìn về hướng player hiện tại
                    Vector3 directionToPlayer = currentPlayerPos - monster.transform.position;
                    if (directionToPlayer.sqrMagnitude > 0.01f)
                    {
                        Quaternion targetRot = Quaternion.LookRotation(directionToPlayer.normalized);
                        monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, targetRot, Time.deltaTime * 5f);
                    }

                    // 🔴 Cập nhật detection cone để xoay cùng với model (quay xung quanh tìm)
                    if (monster.GetNavMeshAgent() != null && monster.GetNavMeshAgent().velocity.sqrMagnitude > 0.01f)
                    {
                        monster.GetPlayerDetector().UpdateDetectionDirection(monster.GetNavMeshAgent().velocity.normalized);
                    }

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

            // [THÊM MỚI]: TÍNH TỔNG THỜI GIAN RƯỢT ĐUỔI VÀ HÚ LOA BÁO CÁO
            if (_currentTargetActorNr != -1)
            {
                int duration = Mathf.RoundToInt(Time.time - _chaseStartTime);

                if (duration > 0)
                {
                    // Truyền ID nạn nhân và số giây bị rượt đi
                    Game.Scripts.Gameplay.Core.GameplayEvents.OnBossTargetedPlayer?.Invoke(_currentTargetActorNr, duration);
                    Debug.Log($"<color=red>[Baiter Tracker]</color> Đã buông tha Player {_currentTargetActorNr} sau {duration} giây rượt đuổi.");
                }

                _currentTargetActorNr = -1; // Xóa trí nhớ
            }
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

        /// <summary>
        /// Lấy vị trí mới nhất của player đang tracking từ NavMesh (trong 2s timeout)
        /// </summary>
        public Vector3 GetCurrentTrackedPlayerPosition()
        {
            // Nếu đang trong phase tracking (mất sight nhưng chưa timeout), return vị trí mới nhất
            if (hasLostSight && (Time.time - lastSeenTime) < lastSeenDuration)
            {
                return monster.GetPlayerPosition();
            }
            // Nếu vẫn detect được player, return position hiện tại
            if (monster.IsPlayerDetected())
            {
                return monster.GetPlayerPosition();
            }
            // Nếu hết timeout, return last known position
            return lastSeenPlayerPos;
        }
    }
}