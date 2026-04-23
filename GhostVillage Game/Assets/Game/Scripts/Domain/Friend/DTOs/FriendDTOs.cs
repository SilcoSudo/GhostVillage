using System;
using System.Collections.Generic;

namespace Game.Domain.Friend.DTOs
{
    // DTO cho kết quả tìm kiếm Player
    [Serializable]
    public class PlayerSearchDTO
    {
        public string userId;
        public string uid;
        public string displayName;
        public string avatar;
        public int level;
    }

    [Serializable]
    public class FriendInfoDTO
    {
        public string _id;
        public string fullname;
        public string avatar;
        public string bio;
    }

    [Serializable]
    public class ProfileInnerDTO
    {
        public string displayName;
        public string avatar;
        public int level;
    }

    // DTO cho 1 người bạn trong danh sách
    [Serializable]
    public class FriendProfileDTO
    {
        public string _id; // Đây là FriendshipId ("69a81df5...")
        public string friendshipId; // Có sẵn trong API List
        public string fullname;     // Có sẵn trong API List
        public string avatar;

        // Backend trả về 'requester' (cho Pending) hoặc 'targetUser' (cho Sent)
        public FriendInfoDTO requester;
        public FriendInfoDTO targetUser;
        public ProfileInnerDTO profile;


        // Lấy User ID để gửi API (Add, Unfriend)
        public string GetUserId()
        {
            if (requester != null && !string.IsNullOrEmpty(requester._id)) return requester._id;
            if (targetUser != null && !string.IsNullOrEmpty(targetUser._id)) return targetUser._id;
            return _id; // Rơi vào Tab FriendList thì _id chính là User ID
        }

        // Lấy Friendship ID để gửi API (Accept, Reject)
        public string GetFriendshipId()
        {
            if (!string.IsNullOrEmpty(friendshipId)) return friendshipId;
            return _id; // Với Pending/Sent thì _id gốc chính là Friendship ID
        }

        // Lấy Tên hiển thị lên UI
        public string GetDisplayName()
        {
            if (requester != null && !string.IsNullOrEmpty(requester.fullname)) return requester.fullname;
            if (targetUser != null && !string.IsNullOrEmpty(targetUser.fullname)) return targetUser.fullname;
            return fullname;
        }

        public string GetAvatar()
        {
            // 1. Quét cục lồng nhau (Dùng cho Pending / Sent)
            if (requester != null && !string.IsNullOrEmpty(requester.avatar)) return requester.avatar;
            if (targetUser != null && !string.IsNullOrEmpty(targetUser.avatar)) return targetUser.avatar;

            // 2. Quét cục profile lồng nhau (Dự phòng cho FriendList nếu BE fix)
            if (profile != null && !string.IsNullOrEmpty(profile.avatar)) return profile.avatar;

            // 3. Lấy thẳng root (Dùng cho FriendList hiện tại)
            if (!string.IsNullOrEmpty(avatar)) return avatar;

            return string.Empty;
        }
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
        public string relatedUserId; // Dùng dự phòng
        public string friendshipId;  // Dùng cho Accept, Reject
    }
}