using UnityEngine;

namespace GhostVillage.Gameplay.Monsters.OngKe
{
    /// <summary>
    /// Skill đặc trưng của Ông Kẹ: Hút player về phía quái theo hình nón.
    /// 3 phase:
    ///   1. Cast  — quái đứng yên, nhìn về player, niệm phép (castTime giây)
    ///   2. Pull  — hút player về phía quái trong pullDuration giây
    ///   3. Cooldown — chờ cooldown giây trước khi dùng lại
    /// </summary>
    public class PullSkill
    {
        public enum Phase { Idle, Casting, Pulling }

        // ── Config ──────────────────────────────────────────────────────────
        private readonly Transform casterTransform;
        private readonly float activationRange;
        private readonly float coneHalfAngle;
        private readonly float maxPullForce;
        private readonly float minPullForce;

        /// <summary>Thời gian niệm phép trước khi hút (giây)</summary>
        private readonly float castTime;

        /// <summary>Thời gian hút (giây)</summary>
        private readonly float pullDuration;

        /// <summary>Cooldown giữa 2 lần dùng skill (giây)</summary>
        private readonly float cooldown;

        private readonly LayerMask obstacleMask;

        // ── Runtime state ────────────────────────────────────────────────────
        private Phase currentPhase = Phase.Idle;
        private float phaseTimer = 0f;
        private float cooldownTimer = 0f;
        private Transform playerTransform;
        private CharacterController playerCC;
        private Rigidbody playerRb;

        // ── Public getters ───────────────────────────────────────────────────
        public Phase CurrentPhase => currentPhase;
        public bool IsCasting  => currentPhase == Phase.Casting;
        public bool IsPulling  => currentPhase == Phase.Pulling;
        public bool IsReady    => cooldownTimer <= 0f && currentPhase == Phase.Idle;
        public float CooldownRemaining => Mathf.Max(0f, cooldownTimer);
        /// <summary>Tiến độ cast 0→1 (dùng cho animation/effect)</summary>
        public float CastProgress => IsCasting ? Mathf.Clamp01(phaseTimer / castTime) : 0f;

        /// <param name="casterTransform">Transform của Ông Kẹ</param>
        /// <param name="activationRange">Tầm xa nón hút (default 15f)</param>
        /// <param name="coneHalfAngle">Góc nửa nón (default 60f = nón 120°)</param>
        /// <param name="maxPullForce">Lực hút tối đa lúc gần (default 12f)</param>
        /// <param name="minPullForce">Lực hút tối thiểu lúc xa (default 3f)</param>
        /// <param name="castTime">Thời gian niệm phép (default 1.5f)</param>
        /// <param name="pullDuration">Thời gian hút giây (default 3f)</param>
        /// <param name="cooldown">Cooldown giây (default 32f)</param>
        /// <param name="obstacleMask">Layer vật cản, 0 = dùng Wall</param>
        public PullSkill(
            Transform casterTransform,
            float activationRange = 15f,
            float coneHalfAngle   = 60f,
            float maxPullForce    = 12f,
            float minPullForce    = 3f,
            float castTime        = 1.5f,
            float pullDuration    = 3f,
            float cooldown        = 32f,
            LayerMask obstacleMask = default)
        {
            this.casterTransform = casterTransform;
            this.activationRange = activationRange;
            this.coneHalfAngle   = coneHalfAngle;
            this.maxPullForce    = maxPullForce;
            this.minPullForce    = minPullForce;
            this.castTime        = castTime;
            this.pullDuration    = pullDuration;
            this.cooldown        = cooldown;
            this.obstacleMask    = obstacleMask == default
                ? LayerMask.GetMask("Wall")
                : obstacleMask;
        }

        // ──────────────────────────────────────────────────────────────────
        // Public API
        // ──────────────────────────────────────────────────────────────────

        /// <summary>
        /// Gọi mỗi frame. Trả về hướng quái cần nhìn (chỉ khi Casting/Pulling),
        /// hoặc null nếu không cần override rotation.
        /// </summary>
        public Vector3? Update()
        {
            if (cooldownTimer > 0f)
                cooldownTimer -= Time.deltaTime;

            switch (currentPhase)
            {
                case Phase.Casting:
                    return UpdateCasting();

                case Phase.Pulling:
                    UpdatePulling();
                    return playerTransform != null
                        ? (casterTransform.position - playerTransform.position) * -1f  // nhìn về player
                        : (Vector3?)null;
            }
            return null;
        }

        /// <summary>
        /// Thử bắt đầu cast. Trả về true nếu thành công (bắt đầu niệm phép).
        /// </summary>
        public bool TryActivate(Transform target)
        {
            if (target == null || !IsReady) return false;
            if (!IsInsideCone(target)) return false;
            if (IsBlocked(target))
            {
                Debug.Log("[PullSkill] Bị tường chặn — không cast.");
                return false;
            }

            StartCasting(target);
            return true;
        }

        /// <summary>Huỷ skill (VD: quái bị interrupt)</summary>
        public void Cancel()
        {
            if (currentPhase == Phase.Idle) return;
            Debug.Log("[PullSkill] Skill bị huỷ.");
            ResetState();
        }

        // ──────────────────────────────────────────────────────────────────
        // Phase handlers
        // ──────────────────────────────────────────────────────────────────

        private void StartCasting(Transform target)
        {
            playerTransform = target;
            playerCC  = target.GetComponent<CharacterController>();
            playerRb  = target.GetComponent<Rigidbody>();
            currentPhase = Phase.Casting;
            phaseTimer   = 0f;
            cooldownTimer = cooldown;
            Debug.Log($"[PullSkill] Bắt đầu niệm phép ({castTime}s)...");
        }

        /// <summary>Trả về hướng nhìn về player trong lúc cast</summary>
        private Vector3? UpdateCasting()
        {
            phaseTimer += Time.deltaTime;

            // Luôn nhìn về player trong lúc cast
            Vector3? lookDir = null;
            if (playerTransform != null)
            {
                Vector3 dir = playerTransform.position - casterTransform.position;
                dir.y = 0f;
                lookDir = dir;
            }

            if (phaseTimer >= castTime)
            {
                currentPhase = Phase.Pulling;
                phaseTimer   = 0f;
                Debug.Log("[PullSkill] Niệm xong → bắt đầu hút!");
            }

            return lookDir;
        }

        private void UpdatePulling()
        {
            phaseTimer += Time.deltaTime;

            if (playerTransform != null)
            {
                if (IsBlocked(playerTransform))
                {
                    Debug.Log("[PullSkill] Tường chặn giữa chừng — dừng hút.");
                    ResetState();
                    return;
                }
                ApplyPull();
            }

            if (phaseTimer >= pullDuration)
            {
                Debug.Log("[PullSkill] Hút xong.");
                ResetState();
            }
        }

        // ──────────────────────────────────────────────────────────────────
        // Helpers
        // ──────────────────────────────────────────────────────────────────

        private bool IsInsideCone(Transform target)
        {
            float dist = Vector3.Distance(casterTransform.position, target.position);
            if (dist > activationRange) return false;
            float angle = Vector3.Angle(casterTransform.forward,
                (target.position - casterTransform.position).normalized);
            return angle <= coneHalfAngle;
        }

        private bool IsBlocked(Transform target)
        {
            Vector3 origin    = casterTransform.position + Vector3.up * 1f;
            Vector3 targetPos = target.position + Vector3.up * 1f;
            Vector3 dir       = (targetPos - origin).normalized;
            float   dist      = Vector3.Distance(origin, targetPos);
            return Physics.Raycast(origin, dir, dist, obstacleMask);
        }

        private float CalculatePullForce(float distance)
        {
            float t = Mathf.Clamp01(distance / activationRange);
            return Mathf.Lerp(maxPullForce, minPullForce, t);
        }

        private void ApplyPull()
        {
            float dist  = Vector3.Distance(casterTransform.position, playerTransform.position);
            float force = CalculatePullForce(dist);
            Vector3 dir = (casterTransform.position - playerTransform.position).normalized;
            dir.y = 0f;
            Vector3 movement = dir * force * Time.deltaTime;

            if (playerCC != null && playerCC.enabled)
                playerCC.Move(movement);
            else if (playerRb != null && !playerRb.isKinematic)
                playerRb.linearVelocity = dir * force;
            else
                playerTransform.position += movement;
        }

        private void ResetState()
        {
            currentPhase = Phase.Idle;
            phaseTimer   = 0f;
            if (playerRb != null && !playerRb.isKinematic)
                playerRb.linearVelocity = Vector3.zero;
            playerTransform = null;
            playerCC = null;
            playerRb = null;
        }

        // ──────────────────────────────────────────────────────────────────
        // Gizmos
        // ──────────────────────────────────────────────────────────────────

        public void DrawGizmos()
        {
            if (casterTransform == null) return;
            Vector3 origin  = casterTransform.position;
            Vector3 forward = casterTransform.forward;

            Color coneColor = IsPulling  ? Color.red
                            : IsCasting  ? Color.magenta
                            : IsReady    ? new Color(0.3f, 0.6f, 1f, 0.4f)
                                         : new Color(0.5f, 0.5f, 0.5f, 0.2f);
            Gizmos.color = coneColor;

            int segments = 16;
            for (int i = 0; i <= segments; i++)
            {
                float angle = Mathf.Lerp(-coneHalfAngle, coneHalfAngle, (float)i / segments);
                Gizmos.DrawRay(origin, Quaternion.AngleAxis(angle, Vector3.up) * forward * activationRange);
            }
            for (int i = 0; i < segments; i++)
            {
                float a1 = Mathf.Lerp(-coneHalfAngle, coneHalfAngle, (float)i / segments);
                float a2 = Mathf.Lerp(-coneHalfAngle, coneHalfAngle, (float)(i + 1) / segments);
                Vector3 p1 = origin + Quaternion.AngleAxis(a1, Vector3.up) * forward * activationRange;
                Vector3 p2 = origin + Quaternion.AngleAxis(a2, Vector3.up) * forward * activationRange;
                Gizmos.DrawLine(p1, p2);
            }
        }
    }
}
