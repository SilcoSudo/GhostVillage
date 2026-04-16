using UnityEngine;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// System để detect player bằng cone casting (hình nón)
    /// </summary>
    public class PlayerDetector : MonoBehaviour
    {
        [Header("--- Detection Config ---")]
        [SerializeField] private float detectionRange = 15f;
        [SerializeField] private float detectionAngle = 120f; // Góc nhìn (120 độ = 60 độ mỗi bên)
        [SerializeField] private float raycastHeight = 0.5f;
        [SerializeField] private int rayCount = 8; // Số rays để check trong hình nón
        [SerializeField] private LayerMask obstacleMask;

        private Transform playerTransform;
        private bool playerDetected = false;
        private Vector3 lastDetectedPlayerPos = Vector3.zero;

        // Biến thêm vào ĐỂ CHỐNG SPAM LOG (chỉ in log 1 lần mỗi giây)
        private float debugLogTimer = 0f;

        private void Start()
        {
            // Tìm player trong scene
            GameObject playerGO = GameObject.FindGameObjectWithTag("Player");
            if (playerGO != null)
            {
                playerTransform = playerGO.transform;
                lastDetectedPlayerPos = playerGO.transform.position;
            }

            if (playerTransform == null)
            {
                Debug.LogError("<color=cyan>[PlayerDetector] Không tìm thấy Player trong scene! Hãy chắc chắn Player có tag 'Player'.</color>");
            }
        }

        private void Update()
        {
            DetectPlayerInCone();
        }



        /// <summary>
        /// Xoay detection cone theo hướng di chuyển (LookForward)
        /// </summary>
        public void UpdateDetectionDirection(Vector3 movementDirection)
        {
            if (movementDirection.sqrMagnitude > 0.01f)
            {
                // Xoay transform để detection cone theo hướng di chuyển
                Quaternion targetRot = Quaternion.LookRotation(movementDirection.normalized);
                transform.rotation = Quaternion.Lerp(transform.rotation, targetRot, Time.deltaTime * 5f);
            }
        }

        /// <summary>
        /// Cone casting để detect player (hình nón)
        /// </summary>
        private void DetectPlayerInCone()
        {
            bool shouldLog = Time.time > debugLogTimer;

            // Tìm tất cả Player trên map
            var players = GameObject.FindGameObjectsWithTag("Player");
            Transform closestVisiblePlayer = null;
            float minDistance = float.MaxValue;

            foreach (var p in players)
            {
                // 1. CHỐNG BÁM XÁC: Nếu thằng này đang bị Knocked -> Lơ nó đi (Bỏ qua luôn)
                var ks = p.GetComponent<PlayerKnockedState>();
                if (ks != null && ks.isKnocked) continue;

                Vector3 directionToPlayer = p.transform.position - transform.position;
                float distanceToPlayer = directionToPlayer.magnitude;

                // 2. Lọc Cự ly (Quá xa -> Bỏ)
                if (distanceToPlayer > detectionRange) continue;

                // 3. Lọc Góc Nhìn (Nằm sau lưng -> Bỏ)
                Vector3 forward = transform.forward;
                float angleToPlayer = Vector3.Angle(forward, directionToPlayer);
                if (angleToPlayer > detectionAngle / 2f) continue;

                // 4. Lọc Vật Cản (Núp sau tường -> Bỏ)
                Vector3 raycastOrigin = transform.position + Vector3.up * raycastHeight;
                Vector3 rayDirection = directionToPlayer.normalized;

                // Bắn tia raycast xem có kẹt tường (obstacleMask) không
                if (!Physics.Raycast(raycastOrigin, rayDirection, distanceToPlayer, obstacleMask))
                {
                    // Lọt qua 4 bước trên = NHÌN THẤY BẰNG MẮT THẬT!
                    // Ưu tiên khóa mục tiêu vào đứa gần nhất
                    if (distanceToPlayer < minDistance)
                    {
                        minDistance = distanceToPlayer;
                        closestVisiblePlayer = p.transform;
                    }
                }
            }

            // CHỐT HẠ KẾT QUẢ QUÉT
            if (closestVisiblePlayer != null)
            {
                if (!playerDetected && shouldLog)
                {
                    Debug.Log("<color=green>[Detector Log]</color> ĐÃ QUÉT VÀ KHÓA MỤC TIÊU SỐNG MỚI!");
                    debugLogTimer = Time.time + 1f;
                }
                playerDetected = true;
                playerTransform = closestVisiblePlayer; // Snap vào đúng cái thằng ĐANG THẤY TRƯỚC MẶT
                lastDetectedPlayerPos = closestVisiblePlayer.position;
            }
            else
            {
                Debug.Log("<color=yellow>[Detector Log]</color> KHÔNG THẤY MỤC TIÊU NÀO TRONG TẦM NHÌN!");
                playerDetected = false;
                // Lưu ý: Đéo set playerTransform = null ở đây để nó còn nhớ điểm cuối cùng mà Investigate
            }
        }

        /// <summary>
        /// Kiểm tra xem player có được detect không
        /// </summary>
        public bool IsPlayerDetected()
        {
            return playerDetected && playerTransform != null;
        }

        /// <summary>
        /// Lấy vị trí player
        /// </summary>
        public Vector3 GetPlayerPosition()
        {
            return playerTransform != null ? playerTransform.position : Vector3.zero;
        }

        /// <summary>
        /// Lấy Transform của player (dùng cho skill cần tham chiếu trực tiếp)
        /// </summary>
        public Transform GetPlayerTransform()
        {
            return playerTransform;
        }

        /// <summary>
        /// Lấy khoảng cách đến player
        /// </summary>
        public float GetDistanceToPlayer()
        {
            if (playerTransform == null)
                return float.MaxValue;

            return Vector3.Distance(transform.position, playerTransform.position);
        }

        /// <summary>
        /// Lấy vị trí cuối cùng mà player được detect
        /// </summary>
        public Vector3 GetLastDetectedPlayerPosition()
        {
            return lastDetectedPlayerPos;
        }

        /// <summary>
        /// Set detection range
        /// </summary>
        public void SetDetectionRange(float range)
        {
            detectionRange = range;
        }

        #region DEBUG
        private void OnDrawGizmos()
        {
            if (!Application.isPlaying)
                return;

            Vector3 monsterPos = transform.position;
            Vector3 forward = transform.forward;

            // Vẽ hình nón detection
            Gizmos.color = playerDetected ? new Color(1, 0, 0, 0.3f) : new Color(0, 1, 0, 0.3f); // Red nếu detect, Green nếu không

            // Vẽ detection range sphere
            Gizmos.DrawWireSphere(monsterPos, detectionRange);

            // Vẽ 2 ray ở biên của hình nón
            float halfAngle = detectionAngle / 2f;

            // Right edge
            Vector3 rightEdge = Quaternion.AngleAxis(halfAngle, Vector3.up) * forward;
            Gizmos.DrawLine(monsterPos, monsterPos + rightEdge * detectionRange);

            // Left edge
            Vector3 leftEdge = Quaternion.AngleAxis(-halfAngle, Vector3.up) * forward;
            Gizmos.DrawLine(monsterPos, monsterPos + leftEdge * detectionRange);

            // Vẽ forward ray
            Gizmos.color = Color.green;
            Gizmos.DrawLine(monsterPos, monsterPos + forward * detectionRange);

            // Nếu detect được player, vẽ line đến player + raycast line
            if (playerDetected && playerTransform != null)
            {
                Gizmos.color = Color.red;
                Gizmos.DrawLine(monsterPos, playerTransform.position);
                Gizmos.DrawSphere(playerTransform.position, 0.3f);

                // Vẽ raycast origin point
                Gizmos.color = Color.yellow;
                Vector3 raycastOrigin = transform.position + Vector3.up * raycastHeight;
                Gizmos.DrawSphere(raycastOrigin, 0.1f);
            }
            else if (playerTransform != null)
            {
                // Không detect - vẽ line mờ đến player vị trí
                Gizmos.color = new Color(1, 0, 0, 0.2f);
                Gizmos.DrawLine(monsterPos, playerTransform.position);
            }
        }
        #endregion
    }
}