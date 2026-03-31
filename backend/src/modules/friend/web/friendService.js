import Friend from "./friendModel.js";
import User from "../../user/userModel.js";
import NotificationService from "../../forum/notifications/notificationService.js";
import mongoose from "mongoose";

class FriendService {
  /**
   * Get friend list (accepted friendships)
   * Returns user objects for all accepted friends
   */
  static async getFriendList(userId) {
    try {
      const friendships = await Friend.find({
        $or: [
          { userId: userId, status: "accepted" },
          { friendId: userId, status: "accepted" },
        ],
      }).populate("userId friendId", "fullname email avatar bio");

      // [BỌC GIÁP]: Lọc bỏ những record mà user đã bị xóa khỏi DB
      const validFriendships = friendships.filter(
        (f) => f.userId != null && f.friendId != null,
      );

      const friends = validFriendships.map((friendship) => {
        const friend =
          friendship.userId._id.toString() === userId.toString()
            ? friendship.friendId
            : friendship.userId;
        return {
          ...(friend.toObject ? friend.toObject() : friend),
          friendshipId: friendship._id,
          acceptedAt: friendship.acceptedAt,
        };
      });

      return friends;
    } catch (error) {
      console.error("Error getting friend list:", error);
      throw error;
    }
  }

  /**
   * Get pending friend requests (incoming)
   */
  static async getPendingRequests(userId) {
    try {
      const requests = await Friend.find({
        friendId: userId,
        status: "pending",
      }).populate("userId", "fullname email avatar bio");

      // [BỌC GIÁP]: Lọc bỏ bóng ma
      const validRequests = requests.filter((r) => r.userId != null);

      return validRequests.map((request) => ({
        ...request.toObject(),
        requester: request.userId,
      }));
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  }

  /**
   * Get sent friend requests (outgoing)
   */
  static async getSentRequests(userId) {
    try {
      const requests = await Friend.find({
        userId: userId,
        status: "pending",
      }).populate("friendId", "fullname email avatar bio");

      // [BỌC GIÁP]: Lọc bỏ bóng ma
      const validRequests = requests.filter((r) => r.friendId != null);

      return validRequests.map((request) => ({
        ...request.toObject(),
        targetUser: request.friendId,
      }));
    } catch (error) {
      console.error("Error getting sent requests:", error);
      throw error;
    }
  }

  /**
   * Add friend (create pending friendship)
   * userA (requester) sends request to userB (target)
   */
  static async addFriend(userAId, userBId, io) {
    try {
      // Check if users exist
      const userA = await User.findById(userAId);
      const userB = await User.findById(userBId);

      if (!userA || !userB) {
        throw new Error("One or both users not found");
      }

      if (userAId.toString() === userBId.toString()) {
        throw new Error("Cannot add yourself as a friend");
      }

      // ========================================================
      // [FIX]: CHECK GIỚI HẠN 20 BẠN TRƯỚC KHI GỬI LỜI MỜI
      // ========================================================
      const countA = await this.getFriendCount(userAId);
      if (countA >= 20) throw new Error("Bạn đã đạt giới hạn 20 người bạn");

      const countB = await this.getFriendCount(userBId);
      if (countB >= 20) throw new Error("Đối phương đã đầy danh sách bạn bè");

      // Check if friendship already exists
      const existingFriendship = await Friend.findOne({
        $or: [
          { userId: userAId, friendId: userBId },
          { userId: userBId, friendId: userAId },
        ],
      });

      if (existingFriendship) {
        if (existingFriendship.status === "pending") {
          throw new Error("Friend request already sent");
        }
        if (existingFriendship.status === "accepted") {
          throw new Error("Already friends with this user");
        }
      }

      // Create friendship record
      const friendship = await Friend.create({
        userId: userAId,
        friendId: userBId,
        status: "pending",
      });

      // Send notification to userB with friendshipId
      await NotificationService.createFriendRequestNotification(
        userA,
        userB,
        friendship._id,
        io,
      );

      // Populate and return
      await friendship.populate("userId friendId", "fullname email avatar bio");
      return friendship;
    } catch (error) {
      console.error("Error adding friend:", error);
      throw error;
    }
  }

  /**
   * Accept friend request
   */
  /**
   * Accept friend request
   */
  static async acceptFriendRequest(friendshipId, io) {
    try {
      const friendship = await Friend.findById(friendshipId).populate(
        "userId friendId",
        "fullname email avatar bio",
      );

      if (!friendship) {
        throw new Error("Friendship not found");
      }

      if (friendship.status !== "pending") {
        throw new Error("Only pending requests can be accepted");
      }

      // ========================================================
      // [FIX]: CHECK GIỚI HẠN 20 BẠN TRƯỚC KHI CHẤP NHẬN
      // ========================================================
      const countA = await this.getFriendCount(friendship.userId._id);
      const countB = await this.getFriendCount(friendship.friendId._id);

      if (countA >= 20 || countB >= 20) {
        throw new Error(
          "Không thể chấp nhận vì một trong hai người đã đạt giới hạn 20 bạn bè",
        );
      }

      // Update status
      friendship.status = "accepted";
      friendship.acceptedAt = new Date();
      await friendship.save();

      // Send notification to requester (userA)
      await NotificationService.createFriendAcceptedNotification(
        friendship.friendId,
        friendship.userId,
        io,
      );

      return friendship;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  }

  /**
   * Accept friend request by relatedUserId (alternative method)
   */
  static async acceptFriendRequestByUserId(currentUserId, relatedUserId, io) {
    try {
      // Try to find friendship where relatedUserId is the requester
      let friendship = await Friend.findOne({
        userId: relatedUserId,
        friendId: currentUserId,
        status: "pending",
      }).populate("userId friendId", "fullname email avatar bio");

      if (!friendship) {
        friendship = await Friend.findOne({
          userId: relatedUserId,
          friendId: currentUserId,
          status: "pending",
        }).populate("userId friendId", "fullname email avatar bio");
      }

      if (!friendship) {
        throw new Error("Friendship not found");
      }

      if (friendship.status !== "pending") {
        throw new Error("Only pending requests can be accepted");
      }

      // ========================================================
      // [FIX]: CHECK GIỚI HẠN 20 BẠN TRƯỚC KHI CHẤP NHẬN
      // ========================================================
      const countA = await this.getFriendCount(friendship.userId._id);
      const countB = await this.getFriendCount(friendship.friendId._id);

      if (countA >= 20 || countB >= 20) {
        throw new Error(
          "Không thể chấp nhận vì một trong hai người đã đạt giới hạn 20 bạn bè",
        );
      }

      // Update status
      friendship.status = "accepted";
      friendship.acceptedAt = new Date();
      await friendship.save();

      // Send notification to requester (userA)
      await NotificationService.createFriendAcceptedNotification(
        friendship.friendId,
        friendship.userId,
        io,
      );

      return friendship;
    } catch (error) {
      console.error("Error accepting friend request by userId:", error);
      throw error;
    }
  }

  /**
   * Reject friend request
   */
  static async rejectFriendRequest(friendshipId) {
    try {
      const friendship = await Friend.findByIdAndDelete(friendshipId);

      if (!friendship) {
        throw new Error("Friendship not found");
      }

      return { message: "Friend request rejected", friendshipId };
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      throw error;
    }
  }

  /**
   * Reject friend request by relatedUserId (alternative method)
   * Used when friendshipId is not available in notification
   */
  static async rejectFriendRequestByUserId(currentUserId, relatedUserId) {
    try {
      const friendship = await Friend.findOneAndDelete({
        userId: relatedUserId,
        friendId: currentUserId,
        status: "pending",
      });

      if (!friendship) {
        throw new Error("Friendship not found");
      }

      return {
        message: "Friend request rejected",
        friendshipId: friendship._id,
      };
    } catch (error) {
      console.error("Error rejecting friend request by userId:", error);
      throw error;
    }
  }

  /**
   * Unfriend (hard delete friendship)
   */
  static async unfriend(userAId, userBId) {
    try {
      const result = await Friend.findOneAndDelete({
        $or: [
          { userId: userAId, friendId: userBId },
          { userId: userBId, friendId: userAId },
        ],
        status: "accepted",
      });

      if (!result) {
        throw new Error("Friendship not found");
      }

      return { message: "Unfriended successfully" };
    } catch (error) {
      console.error("Error unfriending:", error);
      throw error;
    }
  }

  /**
   * Check if two users are friends
   */
  static async areFriends(userAId, userBId) {
    try {
      const friendship = await Friend.findOne({
        $or: [
          { userId: userAId, friendId: userBId, status: "accepted" },
          { userId: userBId, friendId: userAId, status: "accepted" },
        ],
      });

      return !!friendship;
    } catch (error) {
      console.error("Error checking friendship:", error);
      throw error;
    }
  }

  /**
   * [HELPER] Đếm số lượng bạn bè hiện tại đã kết bạn thành công
   */
  static async getFriendCount(targetId) {
    return await Friend.countDocuments({
      $or: [
        { userId: targetId, status: "accepted" },
        { friendId: targetId, status: "accepted" },
      ],
    });
  }

  /**
   * Get friendship status with a specific user
   */
  static async getFriendshipStatus(userAId, userBId) {
    try {
      const friendship = await Friend.findOne({
        $or: [
          { userId: userAId, friendId: userBId },
          { userId: userBId, friendId: userAId },
        ],
      });

      if (!friendship) {
        return null;
      }

      return {
        _id: friendship._id,
        status: friendship.status,
        requestedBy:
          friendship.userId.toString() === userAId.toString()
            ? "self"
            : "other",
        requestedAt: friendship.requestedAt,
        acceptedAt: friendship.acceptedAt,
      };
    } catch (error) {
      console.error("Error getting friendship status:", error);
      throw error;
    }
  }
}

export default FriendService;
