import { useMutation, useQuery } from "@tanstack/react-query";
import messageApi from "../services/messageApi";

/**
 * Hook to send a message
 */
export const useSendMessage = () => {
  return useMutation({
    mutationFn: ({ recipientId, content }) =>
      messageApi.sendMessage(recipientId, content),
    onError: (error) => {
      console.error("Send message error:", error);
    },
  });
};

/**
 * Hook to get conversation with a user
 */
export const useGetConversation = (userId, options = {}) => {
  return useQuery({
    queryKey: ["conversation", userId],
    queryFn: () => messageApi.getConversation(userId),
    enabled: !!userId,
    staleTime: 0, // No cache - always fresh
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * Hook to get unread message count
 */
export const useGetUnreadCount = (options = {}) => {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => messageApi.getUnreadCount(),
    refetchInterval: 5000, // Refetch every 5 seconds
    ...options,
  });
};

/**
 * Hook to get last messages with friends
 */
export const useGetLastMessagesWithFriends = (options = {}) => {
  return useQuery({
    queryKey: ["lastMessagesWithFriends"],
    queryFn: () => messageApi.getLastMessagesWithFriends(),
    refetchInterval: 10000, // Refetch every 10 seconds
    ...options,
  });
};
