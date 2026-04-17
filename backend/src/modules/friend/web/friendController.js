import FriendService from "./friendService.js";

class FriendController {
  /**
   * GET /api/web/friend/list
   * Get all accepted friends
   */
  static async getFriendList(req, res) {
    try {
      const userId = req.user._id;
      const friends = await FriendService.getFriendList(userId);

      res.status(200).json({
        success: true,
        message: "Friends retrieved successfully",
        data: friends,
      });
    } catch (error) {
      console.error("Get friend list error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get friend list",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/web/friend/pending-requests
   * Get pending friend requests (incoming)
   */
  static async getPendingRequests(req, res) {
    try {
      const userId = req.user._id;
      const requests = await FriendService.getPendingRequests(userId);

      res.status(200).json({
        success: true,
        message: "Pending requests retrieved successfully",
        data: requests,
      });
    } catch (error) {
      console.error("Get pending requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get pending requests",
        error: error.message,
      });
    }
  }

  /**
   * GET /api/web/friend/sent-requests
   * Get sent friend requests (outgoing)
   */
  static async getSentRequests(req, res) {
    try {
      const userId = req.user._id;
      const requests = await FriendService.getSentRequests(userId);

      res.status(200).json({
        success: true,
        message: "Sent requests retrieved successfully",
        data: requests,
      });
    } catch (error) {
      console.error("Get sent requests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get sent requests",
        error: error.message,
      });
    }
  }

  /**
   * POST /api/web/friend/add
   * Add friend (send friend request)
   * Body: { targetUserId }
   */
  static async addFriend(req, res) {
    try {
      const userId = req.user._id;
      const { targetUserId } = req.body;
      const io = req.app.get("io");

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "Target user ID is required",
        });
      }

      const friendship = await FriendService.addFriend(
        userId,
        targetUserId,
        io,
      );

      res.status(201).json({
        success: true,
        message: "Friend request sent successfully",
        data: friendship,
      });
    } catch (error) {
      console.error("Add friend error:", error);
      const isLimitError =
        error.message?.includes("maximum number of friends") ||
        error.message?.includes("Friend limit reached");
      const statusCode = isLimitError ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to send friend request",
      });
    }
  }

  /**
   * POST /api/web/friend/accept
   * Accept friend request
   * Body: { friendshipId }
   */
  static async acceptFriendRequest(req, res) {
    try {
      const { friendshipId, relatedUserId } = req.body;
      const io = req.app.get("io");

      // Allow either friendshipId or relatedUserId
      let friendship;
      let error = null;

      if (friendshipId) {
        // Try with friendshipId first
        try {
          friendship = await FriendService.acceptFriendRequest(
            friendshipId,
            io,
          );
        } catch (err) {
          error = err;
          // If not found, try treating friendshipId as relatedUserId
          // (for old notifications that store userId instead of friendshipId)
          try {
            friendship = await FriendService.acceptFriendRequestByUserId(
              req.user._id,
              friendshipId,
              io,
            );
            error = null; // Clear error if second attempt succeeds
          } catch (err2) {
            error = err2;
          }
        }
      } else if (relatedUserId) {
        friendship = await FriendService.acceptFriendRequestByUserId(
          req.user._id,
          relatedUserId,
          io,
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "Either friendshipId or relatedUserId is required",
        });
      }

      if (error) {
        throw error;
      }

      res.status(200).json({
        success: true,
        message: "Friend request accepted successfully",
        data: friendship,
      });
    } catch (error) {
      console.error("Accept friend request error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to accept friend request",
      });
    }
  }

  /**
   * POST /api/web/friend/reject
   * Reject friend request
   * Body: { friendshipId } or { relatedUserId }
   */
  static async rejectFriendRequest(req, res) {
    try {
      const { friendshipId, relatedUserId } = req.body;

      // Allow either friendshipId or relatedUserId
      let result;
      let error = null;

      if (friendshipId) {
        // Try with friendshipId first
        try {
          result = await FriendService.rejectFriendRequest(friendshipId);
        } catch (err) {
          error = err;
          // If not found, try treating friendshipId as relatedUserId
          // (for old notifications that store userId instead of friendshipId)
          try {
            result = await FriendService.rejectFriendRequestByUserId(
              req.user._id,
              friendshipId,
            );
            error = null; // Clear error if second attempt succeeds
          } catch (err2) {
            error = err2;
          }
        }
      } else if (relatedUserId) {
        result = await FriendService.rejectFriendRequestByUserId(
          req.user._id,
          relatedUserId,
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "Either friendshipId or relatedUserId is required",
        });
      }

      if (error) {
        throw error;
      }

      res.status(200).json({
        success: true,
        message: "Friend request rejected successfully",
        data: result,
      });
    } catch (error) {
      console.error("Reject friend request error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to reject friend request",
      });
    }
  }

  /**
   * POST /api/web/friend/unfriend
   * Unfriend a user
   * Body: { targetUserId }
   */
  static async unfriend(req, res) {
    try {
      const userId = req.user._id;
      const { targetUserId } = req.body;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "Target user ID is required",
        });
      }

      const result = await FriendService.unfriend(userId, targetUserId);

      res.status(200).json({
        success: true,
        message: "Unfriended successfully",
        data: result,
      });
    } catch (error) {
      console.error("Unfriend error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to unfriend",
      });
    }
  }

  /**
   * GET /api/web/friend/status/:targetUserId
   * Get friendship status with another user
   */
  static async getFriendshipStatus(req, res) {
    try {
      const userId = req.user._id;
      const { targetUserId } = req.params;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "Target user ID is required",
        });
      }

      const friendship = await FriendService.getFriendshipStatus(
        userId,
        targetUserId,
      );

      res.status(200).json({
        success: true,
        data: friendship,
      });
    } catch (error) {
      console.error("Get friendship status error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get friendship status",
      });
    }
  }
}

export default FriendController;
