import React, { useState, useEffect, useContext } from "react";
import { Bell, Check, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "../../features/notification/hooks/useSocket";
import { AuthContext } from "../../app/context/AuthContext";
import api from "../services/axios";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "../hooks/useFriend";
import "./NotificationBell.css";

const NotificationBell = () => {
  const { token } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("notification"); // 'notification' or 'friendRequest'
  const [processedNotifications, setProcessedNotifications] = useState([]); // Track processed notifications

  // Friend request mutations
  const { mutate: acceptFriendRequest } = useAcceptFriendRequest();
  const { mutate: rejectFriendRequest } = useRejectFriendRequest();

  // Fetch all notifications (both read and unread)
  const { data: allNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/web/notifications");
      return response.data.data;
    },
    enabled: !!token,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Listen for realtime notifications
  useNotifications((notification) => {
    setUnreadCount((prev) => prev + 1);
    refetchNotifications();
  });

  // Update unread count (count only isRead: false)
  useEffect(() => {
    if (allNotifications) {
      const unread = allNotifications.filter((n) => !n.isRead);
      setUnreadCount(unread.length);
    }
  }, [allNotifications]);

  // Separate notifications by type (exclude processed ones)
  const notificationMessages =
    allNotifications?.filter(
      (n) =>
        !processedNotifications.includes(n._id) &&
        (n.type === "postLiked" ||
          n.type === "postCommented" ||
          n.type === "post_commented" ||
          n.type === "commentReplied" ||
          n.type === "comment_replied" ||
          n.type === "friend_accepted" ||
          n.type === "announcement"),
    ) || [];
  const friendRequests =
    allNotifications?.filter(
      (n) =>
        !processedNotifications.includes(n._id) &&
        (n.type === "friendRequest" || n.type === "friend_request"),
    ) || [];

  // Count unread for each tab
  const unreadNotificationCount = notificationMessages.filter(
    (n) => !n.isRead,
  ).length;
  const unreadFriendRequestCount = friendRequests.filter(
    (n) => !n.isRead,
  ).length;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/web/notifications/${notificationId}/read`);
      // Invalidate cache and refetch
      await queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/web/notifications/read-all");
      // Invalidate cache and refetch
      await queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleAcceptFriendRequest = (notification) => {
    console.log("Friend request notification:", notification);
    console.log("Notification relatedEntity:", notification.relatedEntity);

    const friendshipId = notification.relatedEntity?.entityId;
    const relatedUserId =
      notification.relatedUser?._id || notification.relatedUserId;

    console.log("Extracted friendshipId:", friendshipId);
    console.log("Extracted relatedUserId:", relatedUserId);

    if (!friendshipId && !relatedUserId) {
      console.error("Neither Friendship ID nor Related User ID found");
      return;
    }

    // Create request data - use friendshipId if available, otherwise use relatedUserId
    const requestData = {
      ...(friendshipId && { friendshipId }),
      ...(relatedUserId && !friendshipId && { relatedUserId }),
    };

    console.log("Sending request data:", requestData);

    acceptFriendRequest(requestData, {
      onSuccess: () => {
        // Mark notification as processed (will be hidden from UI)
        setProcessedNotifications((prev) => [...prev, notification._id]);
        // Mark notification as read
        handleMarkAsRead(notification._id);
        // Refetch notifications
        refetchNotifications();
        // Invalidate friends query
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      },
      onError: (error) => {
        console.error("Error accepting friend request:", error);
      },
    });
  };

  const handleRejectFriendRequest = (notification) => {
    const friendshipId = notification.relatedEntity?.entityId;
    const relatedUserId =
      notification.relatedUser?._id || notification.relatedUserId;

    if (!friendshipId && !relatedUserId) {
      console.error("Neither Friendship ID nor Related User ID found");
      return;
    }

    // Create request data - use friendshipId if available, otherwise use relatedUserId
    const requestData = {
      ...(friendshipId && { friendshipId }),
      ...(relatedUserId && !friendshipId && { relatedUserId }),
    };

    rejectFriendRequest(requestData, {
      onSuccess: () => {
        // Mark notification as processed (will be hidden from UI)
        setProcessedNotifications((prev) => [...prev, notification._id]);
        // Mark notification as read
        handleMarkAsRead(notification._id);
        // Refetch notifications
        refetchNotifications();
      },
      onError: (error) => {
        console.error("Error rejecting friend request:", error);
      },
    });
  };

  return (
    <div className="notification-bell-container">
      <button
        className={`notification-bell ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-tabs">
            <button
              className={`tab-btn ${activeTab === "notification" ? "active" : ""}`}
              onClick={() => setActiveTab("notification")}
            >
              Notification Message
              {unreadNotificationCount > 0 && (
                <span className="tab-badge">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === "friendRequest" ? "active" : ""}`}
              onClick={() => setActiveTab("friendRequest")}
            >
              Friend Requests
              {unreadFriendRequestCount > 0 && (
                <span className="tab-badge">
                  {unreadFriendRequestCount > 9
                    ? "9+"
                    : unreadFriendRequestCount}
                </span>
              )}
            </button>
          </div>

          <div className="notification-list">
            {activeTab === "notification" ? (
              notificationMessages.length > 0 ? (
                notificationMessages.slice(0, 5).map((notification) => (
                  <div
                    key={notification._id}
                    className="notification-item"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    <div className="notification-content">
                      <p className="notification-title">{notification.title}</p>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className="notification-dot"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="notification-empty">
                  <p>No notification messages.</p>
                </div>
              )
            ) : friendRequests.length > 0 ? (
              friendRequests.slice(0, 5).map((notification) => (
                <div
                  key={notification._id}
                  className="notification-item friend-request-item"
                >
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">
                      {notification.message}
                    </p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  {(notification.type === "friend_request" ||
                    notification.type === "friendRequest") && (
                    <div className="friend-request-actions">
                      <button
                        className="btn-accept"
                        onClick={() => handleAcceptFriendRequest(notification)}
                        title="Đồng ý"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleRejectFriendRequest(notification)}
                        title="Từ chối"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {!notification.isRead && (
                    <div className="notification-dot"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <p>No friend requests.</p>
              </div>
            )}
          </div>

          {allNotifications && allNotifications.length > 5 && (
            <div className="notification-footer">
              <a href="/notifications" className="view-all">
                Xem tất cả thông báo
              </a>
            </div>
          )}

          <div className="notification-info">
            <p>Thông báo sau 15 ngày sẽ tự động xóa</p>
            <button
              className="read-all-btn"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Read all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
