import { useEffect } from "react";
import { useNotifications, useSocket } from "../hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * Global component để handle realtime notifications
 * Place this component ở root level của app (App.jsx hoặc main layout)
 */
export const NotificationListener = ({ token }) => {
  const queryClient = useQueryClient();
  const { isConnected } = useSocket(token);

  // Listen for notifications
  useNotifications((notification) => {
    console.log("Notification received:", notification);

    // Show toast
    toast.success(notification.message, {
      duration: 4000,
      icon: "🔔",
    });

    // Invalidate queries to refresh data
    if (
      notification.type === "post_liked" ||
      notification.type === "post_commented"
    ) {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }

    if (
      notification.type === "friend_request" ||
      notification.type === "friend_accepted"
    ) {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    }

    if (
      notification.type === "ticket_replied" ||
      notification.type === "ticketReplied"
    ) {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    }

    // Optional: Play sound
    playNotificationSound();
  });

  // Show connection status
  useEffect(() => {
    if (isConnected) {
      console.log("✓ Socket connected - Ready for realtime notifications");
    } else {
      console.log("✗ Socket disconnected - Will retry connection");
    }
  }, [isConnected]);

  return null; // This is a listener component, no UI
};

/**
 * Play notification sound (optional)
 */
const playNotificationSound = () => {
  const audio = new Audio("/sounds/notification.mp3");
  audio.play().catch((err) => {
    // Audio play might be blocked by browser
    console.log("Notification sound blocked by browser");
  });
};

export default NotificationListener;
