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

        private void Start()
        {
            // Tìm player trong scene
            GameObject playerGO = GameObject.FindGameObjectWithTag("Player");
            if (playerGO != null)
            {
                playerTransform = playerGO.transform;
                lastDetectedPlayerPos = playerGO.transform.position;
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
            if (playerTransform == null)
            {
                playerDetected = false;
                return;
            }

            Vector3 directionToPlayer = playerTransform.position - transform.position;
            float distanceToPlayer = directionToPlayer.magnitude;

            // Check khoảng cách
            if (distanceToPlayer > detectionRange)
            {
                playerDetected = false;
                return;
            }

            // Check góc (có trong hình nón không)
            Vector3 forward = transform.forward;
            float angleToPlayer = Vector3.Angle(forward, directionToPlayer);

            if (angleToPlayer > detectionAngle / 2f)
            {
                playerDetected = false;
                return;
            }

            // Raycast check line of sight
            Vector3 raycastOrigin = transform.position + Vector3.up * raycastHeight;
            Vector3 rayDirection = directionToPlayer.normalized;

            // Vẽ debug ray
            Debug.DrawRay(raycastOrigin, rayDirection * distanceToPlayer, Color.yellow);

            if (Physics.Raycast(raycastOrigin, rayDirection, distanceToPlayer, obstacleMask))
            {
                // Có vật cản giữa monster và player
                playerDetected = false;
                return;
            }

            // Thấy player rồi
            playerDetected = true;
            lastDetectedPlayerPos = playerTransform.position;
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
