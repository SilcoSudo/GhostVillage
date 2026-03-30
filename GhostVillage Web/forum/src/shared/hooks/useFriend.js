import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import FriendAPI from "../services/friendApi.js";

/**
 * useFriendList Hook
 * Fetch all accepted friends
 */
export const useFriendList = (options = {}) => {
  return useQuery({
    queryKey: ["friends", "list"],
    queryFn: async () => {
      const response = await FriendAPI.getFriendList();
      return response.data.data;
    },
    ...options,
  });
};

/**
 * usePendingFriendRequests Hook
 * Fetch all incoming friend requests
 */
export const usePendingFriendRequests = () => {
  return useQuery({
    queryKey: ["friends", "pending-requests"],
    queryFn: async () => {
      const response = await FriendAPI.getPendingRequests();
      return response.data.data;
    },
  });
};

/**
 * useSentFriendRequests Hook
 * Fetch all sent friend requests
 */
export const useSentFriendRequests = () => {
  return useQuery({
    queryKey: ["friends", "sent-requests"],
    queryFn: async () => {
      const response = await FriendAPI.getSentRequests();
      return response.data.data;
    },
  });
};

/**
 * useAddFriend Hook
 * Send friend request mutation
 */
export const useAddFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId) => FriendAPI.addFriend(targetUserId),
    onSuccess: (response, targetUserId) => {
      toast.success("Friend request sent!");
      // Invalidate sent requests cache
      queryClient.invalidateQueries({ queryKey: ["friends", "sent-requests"] });
      // Invalidate friendship status for this user
      queryClient.invalidateQueries({
        queryKey: ["friends", "status", targetUserId],
      });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to send friend request";
      toast.error(message);
    },
  });
};

/**
 * useAcceptFriendRequest Hook
 * Accept friend request mutation
 */
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId) => FriendAPI.acceptFriendRequest(friendshipId),
    onSuccess: () => {
      toast.success("Friend request accepted!");
      // Invalidate related caches
      queryClient.invalidateQueries({
        queryKey: ["friends", "pending-requests"],
      });
      queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
      // Invalidate all friendship status queries
      queryClient.invalidateQueries({
        queryKey: ["friends", "status"],
      });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to accept friend request";
      toast.error(message);
    },
  });
};

/**
 * useRejectFriendRequest Hook
 * Reject friend request mutation
 */
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId) => FriendAPI.rejectFriendRequest(friendshipId),
    onSuccess: () => {
      toast.success("Friend request rejected");
      // Invalidate pending requests cache
      queryClient.invalidateQueries({
        queryKey: ["friends", "pending-requests"],
      });
      // Invalidate all friendship status queries
      queryClient.invalidateQueries({
        queryKey: ["friends", "status"],
      });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to reject friend request";
      toast.error(message);
    },
  });
};

/**
 * useUnfriend Hook
 * Unfriend mutation
 */
export const useUnfriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId) => FriendAPI.unfriend(targetUserId),
    onSuccess: (response, targetUserId) => {
      toast.success("Friend removed");
      // Invalidate friend list cache
      queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
      // Invalidate friendship status for this user
      queryClient.invalidateQueries({
        queryKey: ["friends", "status", targetUserId],
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to unfriend";
      toast.error(message);
    },
  });
};

/**
 * useFriendshipStatus Hook
 * Check friendship status with a specific user
 * @param {string} targetUserId - User ID to check status with
 * @param {object} options - Additional query options (e.g., { enabled: false })
 */
export const useFriendshipStatus = (targetUserId, options = {}) => {
  return useQuery({
    queryKey: ["friends", "status", targetUserId],
    queryFn: async () => {
      const response = await FriendAPI.getFriendshipStatus(targetUserId);
      return response.data.data;
    },
    enabled: options.enabled !== undefined ? options.enabled : !!targetUserId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
};
