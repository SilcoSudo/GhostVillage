using UnityEngine;
using GhostVillage.Gameplay.Base;
using Photon.Pun;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// State: Quái tấn công player
    /// </summary>
    public class AttackState : IMonsterState
    {
        private readonly MonsterBase monster;
        private readonly float attackRange = 1.5f; // Tầm tấn công
        private readonly float attackCooldown = 1f; // Cooldown tấn công (giây)
        private readonly bool useJumpscareAttack;

        private float lastAttackTime = 0f;
        private bool hasAttackedThisFrame = false;
        private float lastDebugLogTime = 0f; // Để tránh spam log
        private bool isFirstEnter = true; // Track lần Enter đầu tiên
        private float activeJumpscareUntil = 0f;
        private int activeVictimViewId = -1;

        public AttackState(MonsterBase monster, float attackRange = 1.5f, float attackCooldown = 1f, bool useJumpscareAttack = false)
        {
            this.monster = monster;
            this.attackRange = attackRange;
            this.attackCooldown = attackCooldown;
            this.useJumpscareAttack = useJumpscareAttack;
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
        /// Thực hiện tấn công - OngKe knock player thay vì damage
        /// </summary>
        private void PerformAttack()
        {
            Vector3 playerPos = monster.GetPlayerPosition();
            float distanceToPlayer = Vector3.Distance(monster.transform.position, playerPos);

            if (distanceToPlayer > attackRange)
            {
                Debug.Log($"⚠️ AttackState: Tấn công nhưng không trúng (Distance: {distanceToPlayer:F1}m > {attackRange}m)");
                return;
            }

            Debug.Log("💥 AttackState: ĐÃ HIT PLAYER! -> Knock state");

            PlayerKnockedState knockedState = TryGetTargetKnockedState(playerPos);
            if (knockedState != null)
            {
                if (!knockedState.isKnocked)
                {
                    if (useJumpscareAttack)
                    {
                        TriggerJumpscareAttack(knockedState);
                    }
                    else
                    {
                        knockedState.GetKnocked();
                        Debug.Log($"✓ Player knocked: {knockedState.name}");
                    }
                }
            }
            else
            {
                Debug.LogWarning("⚠️ AttackState: HIT nhưng không tìm thấy PlayerKnockedState trên collider mục tiêu.");
            }

            hasAttackedThisFrame = true;
        }

        private PlayerKnockedState TryGetTargetKnockedState(Vector3 playerPos)
        {
            Vector3 dirToPlayer = (playerPos - monster.transform.position).normalized;

            // Ưu tiên raycast thẳng từ quái tới player.
            if (Physics.Raycast(monster.transform.position, dirToPlayer, out RaycastHit hit, attackRange + 0.75f))
            {
                PlayerKnockedState byRay = hit.collider.GetComponentInParent<PlayerKnockedState>();
                if (byRay != null) return byRay;
            }

            // Fallback: quét quanh vị trí player do một số prefab có collider con/lệch tâm.
            Collider[] nearby = Physics.OverlapSphere(playerPos, 1.5f);
            foreach (var col in nearby)
            {
                PlayerKnockedState byOverlap = col.GetComponentInParent<PlayerKnockedState>();
                if (byOverlap != null) return byOverlap;
            }

            return null;
        }

        private void TriggerJumpscareAttack(PlayerKnockedState knockedState)
        {
            PhotonView monsterPv = monster.GetComponent<PhotonView>();
            PhotonView victimPv = knockedState.GetComponent<PhotonView>();

            if (monsterPv == null || victimPv == null)
            {
                // Fallback để không bị mất sát thương nếu prefab thiếu PhotonView.
                knockedState.GetKnocked();
                Debug.LogWarning("⚠️ AttackState: Thiếu PhotonView, fallback sang knock trực tiếp.");
                return;
            }

            bool sameVictimStillInProgress =
                activeVictimViewId == victimPv.ViewID &&
                Time.time < activeJumpscareUntil;

            if (sameVictimStillInProgress)
            {
                return;
            }

            victimPv.RPC("ReceiveJumpscareRPC", RpcTarget.All, monsterPv.ViewID);
            activeVictimViewId = victimPv.ViewID;
            activeJumpscareUntil = Time.time + 2.6f;

            Debug.Log($"👁️ AttackState: Trigger jumpscare for {knockedState.name}");
        }
    }
}
