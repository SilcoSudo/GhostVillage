using System;
using System.Collections.Generic;

namespace Game.Domain.Friend.DTOs
{
    // DTO cho kết quả tìm kiếm Player
    [Serializable]
    public class PlayerSearchDTO
    {
        public string userId;      // ID gốc để add friend (Cái mã dài)
        public string uid;         // 8 số
        public string displayName;
        public string avatar;
        public int level;
    }

    // DTO cho 1 người bạn trong danh sách
    [Serializable]
    public class FriendProfileDTO
    {
        public string _id;          // ID của User đó
        public string fullname;     // Tên (từ bảng User)
        public string avatar;       // Avatar
        public string bio;
        public string friendshipId; // ID của mối quan hệ (Dùng khi Accept/Reject nếu cần)
        // Lưu ý: Tên biến phải khớp với JSON trả về từ Backend
    }

    // Helper wrapper để Unity JsonUtility parse được Array JSON (Ví dụ: [ {..}, {..} ])
    [Serializable]
    public class FriendListWrapper
    {
        public List<FriendProfileDTO> items;
    }

    // DTO để gửi Request Body (Dùng cho POST Add, Accept, Reject, Unfriend)
    [Serializable]
    public class FriendRequestBody
    {
        public string targetUserId;  // Dùng cho Add, Unfriend
        public string relatedUserId; // Dùng cho Accept, Reject
    }
}