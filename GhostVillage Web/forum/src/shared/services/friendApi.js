import instance from "./axios.js";

const API_BASE = "/web/friend";

class FriendAPI {
  /**
   * Get all accepted friends
   */
  static getFriendList() {
    return instance.get(`${API_BASE}/list`);
  }

  /**
   * Get pending incoming friend requests
   */
  static getPendingRequests() {
    return instance.get(`${API_BASE}/pending-requests`);
  }

  /**
   * Get sent outgoing friend requests
   */
  static getSentRequests() {
    return instance.get(`${API_BASE}/sent-requests`);
  }

  /**
   * Send friend request to another user
   * @param {string} targetUserId - ID of user to send request to
   */
  static addFriend(targetUserId) {
    return instance.post(`${API_BASE}/add`, {
      targetUserId,
    });
  }

  /**
   * Accept an incoming friend request
   * @param {string|object} data - friendshipId (string) or object with { friendshipId } or { relatedUserId }
   */
  static acceptFriendRequest(data) {
    const payload = typeof data === "string" ? { friendshipId: data } : data;
    return instance.post(`${API_BASE}/accept`, payload);
  }

  /**
   * Reject an incoming friend request
   * @param {string|object} data - friendshipId (string) or object with { friendshipId } or { relatedUserId }
   */
  static rejectFriendRequest(data) {
    const payload = typeof data === "string" ? { friendshipId: data } : data;
    return instance.post(`${API_BASE}/reject`, payload);
  }

  /**
   * Remove friend (unfriend)
   * @param {string} targetUserId - ID of user to unfriend
   */
  static unfriend(targetUserId) {
    return instance.post(`${API_BASE}/unfriend`, {
      targetUserId,
    });
  }

  /**
   * Get friendship status with another user
   * @param {string} targetUserId - ID of user to check
   * @returns {Promise} - Status: 'pending', 'accepted', or null
   */
  static getFriendshipStatus(targetUserId) {
    return instance.get(`${API_BASE}/status/${targetUserId}`);
  }
}

export default FriendAPI;
