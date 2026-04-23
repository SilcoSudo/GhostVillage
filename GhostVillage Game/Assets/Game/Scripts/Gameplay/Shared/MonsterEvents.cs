using UnityEngine;

namespace GhostVillage.Gameplay.Shared
{
    /// <summary>
    /// Sự kiện tĩnh để các monster thông báo cho nhau.
    /// Không dùng Photon — chỉ giao tiếp trong phạm vi MasterClient.
    /// </summary>
    public static class MonsterEvents
    {
        /// <summary>
        /// Vòng Nhi phát hiện player và báo vị trí.
        /// OngKe lắng nghe event này để ForceChase.
        /// </summary>
        public static event System.Action<Vector3> OnPlayerSpotted;

        /// <summary>Gọi từ VongNhiMonster khi phát hiện player</summary>
        public static void AlertPlayerSpotted(Vector3 playerPosition)
        {
            Debug.Log($"<color=orange>[MonsterEvents]</color> Vòng Nhi báo player tại {playerPosition}");
            OnPlayerSpotted?.Invoke(playerPosition);
        }
    }
}
