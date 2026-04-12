using UnityEngine;
using UnityEngine.AI;

namespace GhostVillage.Gameplay.MonsterTypes.MaDa_Ghost
{
    /// <summary>
    /// Skill dịch chuyển của Ma Da.
    /// 4 phase:
    ///   1. Idle    — Không làm gì
    ///   2. Sinking — Tắt AI, lặn xuống đất (sinkTime giây)
    ///   3. Warning — Dời qua vũng nước đích, phát âm thanh ùng ục (warningTime giây)
    ///   4. Rising  — Trồi lên mặt đất, bật lại AI (riseTime giây)
    /// </summary>
    public class MaDaTeleportSkill
    {
        public enum Phase { Idle, Sinking, Warning, Rising }

        // ── Config ──────────────────────────────────────────────────────────
        private readonly Transform casterTransform;
        private readonly NavMeshAgent navMeshAgent;
        private readonly Collider collider;
        private readonly Animator animator;
        private readonly AudioSource audioSource;

        private readonly float sinkTime;
        private readonly float warningTime;
        private readonly float riseTime;
        private readonly float depth = 3f; // Độ sâu lặn xuống

        private readonly AudioClip splashSound;
        private readonly AudioClip gurgleSound;

        // ── Runtime state ────────────────────────────────────────────────────
        private Phase currentPhase = Phase.Idle;
        private float phaseTimer = 0f;
        private Vector3 startPos;
        private Vector3 targetPuddlePos;

        // ── Public getters ───────────────────────────────────────────────────
        public Phase CurrentPhase => currentPhase;
        public bool IsActive => currentPhase != Phase.Idle;

        public MaDaTeleportSkill(
            Transform casterTransform,
            NavMeshAgent navMeshAgent,
            Collider collider,
            Animator animator,
            AudioSource audioSource,
            AudioClip splashSound,
            AudioClip gurgleSound,
            float sinkTime = 2f,
            float warningTime = 5f,
            float riseTime = 2f)
        {
            this.casterTransform = casterTransform;
            this.navMeshAgent = navMeshAgent;
            this.collider = collider;
            this.animator = animator;
            this.audioSource = audioSource;
            this.splashSound = splashSound;
            this.gurgleSound = gurgleSound;
            this.sinkTime = sinkTime;
            this.warningTime = warningTime;
            this.riseTime = riseTime;
        }

        // ──────────────────────────────────────────────────────────────────
        // Public API
        // ──────────────────────────────────────────────────────────────────

        public void Update()
        {
            if (currentPhase == Phase.Idle) return;

            phaseTimer += Time.deltaTime;

            switch (currentPhase)
            {
                case Phase.Sinking:
                    UpdateSinking();
                    break;
                case Phase.Warning:
                    UpdateWarning();
                    break;
                case Phase.Rising:
                    UpdateRising();
                    break;
            }
        }

        public bool TryActivate(Vector3 targetPuddle)
        {
            if (IsActive) return false;

            targetPuddlePos = targetPuddle;
            startPos = casterTransform.position;

            // Khóa AI và va chạm
            if (navMeshAgent != null) navMeshAgent.enabled = false;
            if (collider != null) collider.enabled = false;
            if (animator != null) animator.SetFloat("Speed", 0f);

            Debug.Log($"[MaDaTeleportSkill] Bắt đầu lặn xuống...");
            ChangePhase(Phase.Sinking);
            return true;
        }

        public void Cancel()
        {
            if (currentPhase == Phase.Idle) return;
            Debug.Log("[MaDaTeleportSkill] Skill bị huỷ.");
            EndSkill();
        }

        // ──────────────────────────────────────────────────────────────────
        // Phase handlers
        // ──────────────────────────────────────────────────────────────────

        private void UpdateSinking()
        {
            float t = Mathf.Clamp01(phaseTimer / sinkTime);
            casterTransform.position = Vector3.Lerp(startPos, startPos + Vector3.down * depth, t);

            if (phaseTimer >= sinkTime)
            {
                ChangePhase(Phase.Warning);
            }
        }

        private void UpdateWarning()
        {
            if (phaseTimer >= warningTime)
            {
                ChangePhase(Phase.Rising);
            }
        }

        private void UpdateRising()
        {
            float t = Mathf.Clamp01(phaseTimer / riseTime);
            casterTransform.position = Vector3.Lerp(targetPuddlePos + Vector3.down * depth, targetPuddlePos, t);

            if (phaseTimer >= riseTime)
            {
                Debug.Log("[MaDaTeleportSkill] Hoàn tất dịch chuyển!");
                EndSkill();
            }
        }

        private void ChangePhase(Phase newPhase)
        {
            currentPhase = newPhase;
            phaseTimer = 0f;

            switch (newPhase)
            {
                case Phase.Sinking:
                    PlaySound(splashSound, false);
                    break;

                case Phase.Warning:
                    // Dịch chuyển tức thời sang vũng bùn mới (ở dưới lòng đất)
                    casterTransform.position = targetPuddlePos + Vector3.down * depth;
                    PlaySound(gurgleSound, true); // Sôi ùng ục
                    break;

                case Phase.Rising:
                    if (audioSource != null) audioSource.Stop();
                    PlaySound(splashSound, false);
                    if (animator != null) animator.SetTrigger("TriggerRise");
                    break;
            }
        }

        private void EndSkill()
        {
            currentPhase = Phase.Idle;
            phaseTimer = 0f;
            casterTransform.position = targetPuddlePos;

            // Trả lại AI
            if (navMeshAgent != null) navMeshAgent.enabled = true;
            if (collider != null) collider.enabled = true;
            if (audioSource != null) audioSource.Stop();
        }

        private void PlaySound(AudioClip clip, bool loop)
        {
            if (audioSource == null || clip == null) return;
            audioSource.loop = loop;
            if (loop)
            {
                audioSource.clip = clip;
                audioSource.Play();
            }
            else
            {
                audioSource.PlayOneShot(clip);
            }
        }
    }
}