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
        private readonly float investigateWaitTime = 2f;
        private readonly float lookAroundSpeed = 90f; // Độ quay mỗi giây (độ)

        private Vector3 investigatePosition = Vector3.zero;
        private float investigateStartTime = 0f;
        private float currentLookAngle = 0f; // Góc hiện tại khi quay xung quanh

        public InvestigateState(MonsterBase monster, Vector3 lastPlayerPosition)
        {
            this.monster = monster;
            this.investigatePosition = lastPlayerPosition;
        }

        public void Enter()
        {
            Debug.Log($"🟡 InvestigateState: Bắt đầu điều tra vị trí {investigatePosition}");
            investigateStartTime = Time.time;
            currentLookAngle = 0f;
            monster.MoveTo(investigatePosition); // Di chuyển tới vị trí cuối
        }

        public void Update()
        {
            // Kiểm tra đã tới vị trí chưa
            float distanceToTarget = Vector3.Distance(monster.transform.position, investigatePosition);
            if (distanceToTarget > 0.5f)
            {
                // Chưa tới - tiếp tục di chuyển
                monster.MoveTo(investigatePosition);
                return;
            }

            // Đã tới vị trí - bắt đầu nhìn xung quanh
            float timeSinceStart = Time.time - investigateStartTime;

            if (timeSinceStart < investigateWaitTime)
            {
                // Quay hướng xung quanh để tìm player (360 độ)
                currentLookAngle += lookAroundSpeed * Time.deltaTime;
                if (currentLookAngle > 360f)
                {
                    currentLookAngle -= 360f;
                }

                // Tính hướng nhìn (dựa trên góc hiện tại)
                Vector3 lookDirection = new Vector3(
                    Mathf.Sin(Mathf.Deg2Rad * currentLookAngle),
                    0f,
                    Mathf.Cos(Mathf.Deg2Rad * currentLookAngle)
                );

                // Quay nhìn theo hướng đó
                if (lookDirection.sqrMagnitude > 0.01f)
                {
                    Quaternion targetRot = Quaternion.LookRotation(lookDirection);
                    monster.transform.rotation = Quaternion.Lerp(monster.transform.rotation, targetRot, Time.deltaTime * 5f);
                }

                Debug.Log($"🟡 InvestigateState: Nhìn xung quanh... ({timeSinceStart:F1}s / {investigateWaitTime}s)");
            }
        }

        public void Exit()
        {
            Debug.Log("⚪ InvestigateState: Kết thúc điều tra!");
            monster.Stop();
        }

        public bool ShouldExit()
        {
            // Thoát investigate nếu hết thời gian chờ
            if ((Time.time - investigateStartTime) >= investigateWaitTime)
            {
                Debug.Log($"⚪ InvestigateState: Hết thời gian, quay lại Patrol!");
                return true;
            }

            // Nếu vẫn detect player trong lúc investigate - quay lại Chase
            if (monster.IsPlayerDetected())
            {
                Debug.Log($"🔴 InvestigateState: Lại thấy player! Quay lại Chase!");
                return true;
            }

            return false;
        }
    }
}
