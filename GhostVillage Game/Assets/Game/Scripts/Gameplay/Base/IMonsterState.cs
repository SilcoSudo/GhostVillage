using UnityEngine;

namespace GhostVillage.Gameplay.Base
{
    /// <summary>
    /// Interface định nghĩa một state của quái vật
    /// </summary>
    public interface IMonsterState
    {
        /// <summary>
        /// Gọi khi state bắt đầu
        /// </summary>
        void Enter();

        /// <summary>
        /// Cập nhật logic state mỗi frame
        /// </summary>
        void Update();

        /// <summary>
        /// Gọi khi state kết thúc
        /// </summary>
        void Exit();

        /// <summary>
        /// Kiểm tra xem state này có nên kết thúc không
        /// </summary>
        bool ShouldExit();
    }
}
