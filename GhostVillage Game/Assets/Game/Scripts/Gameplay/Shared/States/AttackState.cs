using UnityEngine;
using GhostVillage.Gameplay.Base;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái tấn công player
    /// </summary>
    public class AttackState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float attackRange = 1.5f; // Tầm tấn công
        private readonly float attackDamage = 10f; // Sát thương
        private readonly float attackCooldown = 1f; // Cooldown tấn công (giây)

        private float lastAttackTime = 0f;
        private bool hasAttackedThisFrame = false;
        private float lastDebugLogTime = 0f; // Để tránh spam log
        private bool isFirstEnter = true; // Track lần Enter đầu tiên

        public AttackState(MonsterBase monster, float attackRange = 1.5f, float attackDamage = 10f, float attackCooldown = 1f)
        {
            this.monster = monster;
            this.attackRange = attackRange;
            this.attackDamage = attackDamage;
            this.attackCooldown = attackCooldown;
        }

        public void Enter()
        {
            Debug.Log("⚔️ AttackState: Bắt đầu tấn công!");
            
            // Chỉ reset cooldown lần Enter đầu tiên
            if (isFirstEnter)
            {
                lastAttackTime = Time.time;
                isFirstEnter = false;
            }
            else
            {
                // Nếu re-enter (từ Chase), giữ nguyên cooldown (không reset)
                // Điều này để tránh cooldown bị reset khi state oscillate
            }
            
            hasAttackedThisFrame = false;
        }

        public void Update()
        {
            // Luôn nhìn về player
            monster.LookAtPlayer();

            // Check cooldown
            float timeSinceLastAttack = Time.time - lastAttackTime;

            if (timeSinceLastAttack >= attackCooldown)
            {
                // Tấn công!
                PerformAttack();
                lastAttackTime = Time.time;
            }
            else
            {
                // Debug: show cooldown (chỉ log mỗi 0.2 giây để tránh spam)
                if (Time.time - lastDebugLogTime >= 0.2f)
                {
                    float cooldownPercent = (attackCooldown - timeSinceLastAttack) / attackCooldown * 100f;
                    Debug.Log($"⏱️ AttackState: Cooldown {cooldownPercent:F0}% ({attackCooldown - timeSinceLastAttack:F1}s)");
                    lastDebugLogTime = Time.time;
                }
            }
        }

        public void Exit()
        {
            Debug.Log("⚔️ AttackState: Dừng tấn công!");
            monster.Stop();
            // Không reset isFirstEnter - giữ nguyên để tính cooldown liên tục
        }

        public bool ShouldExit()
        {
            // Thoát attack state nếu:
            // 1. Player không được detect nữa
            // 2. Player quá xa (5m)
            if (!monster.IsPlayerDetected())
            {
                Debug.Log("⚔️ AttackState: Player không được detect nữa!");
                return true;
            }

            float distanceToPlayer = Vector3.Distance(monster.transform.position, monster.GetPlayerPosition());
            float exitDistance = 5f; // Thoát nếu player > 5m
            
            if (distanceToPlayer > exitDistance)
            {
                Debug.Log($"⚔️ AttackState: Player quá xa ({distanceToPlayer:F1}m > {exitDistance}m)!");
                return true;
            }

            return false;
        }

        /// <summary>
        /// Thực hiện tấn công
        /// </summary>
        private void PerformAttack()
        {
            Vector3 playerPos = monster.GetPlayerPosition();
            float distanceToPlayer = Vector3.Distance(monster.transform.position, playerPos);

            // Check khoảng cách tấn công
            if (distanceToPlayer <= attackRange)
            {
                Debug.Log($"💥 AttackState: ĐÃ ĐÁNH TRÚNG PLAYER! Damage: {attackDamage}");

                // TODO: Damage player (implement sau)
                // player.TakeDamage(attackDamage);

                hasAttackedThisFrame = true;
            }
            else
            {
                Debug.Log($"⚠️ AttackState: Tấn công nhưng không trúng (Distance: {distanceToPlayer:F1}m > {attackRange}m)");
            }
        }

        /// <summary>
        /// Set attack damage
        /// </summary>
        public void SetAttackDamage(float damage)
        {
            // attackDamage = damage; // Không thể vì field là readonly
        }
    }
}
