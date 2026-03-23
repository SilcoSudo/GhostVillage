using System;

namespace Game.Core.Network.Chat
{
    [Serializable]
    public class InviteMessageDTO
    {
        public string type; // Luôn để là "ROOM_INVITE" để máy bên kia biết đường phân loại
        public string senderName; // Tên thằng mời (ví dụ: Hùng Đẹp Trai)
        public string roomName; // Tên phòng để join (ví dụ: 123)
        // Có thể thêm timestamp hoặc pass nếu cần, nhưng yêu cầu của sếp là bypass pass nên ta chỉ cần roomName
    }
}