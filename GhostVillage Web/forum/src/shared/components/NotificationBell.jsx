import React, { useState, useEffect, useContext } from "react";
import { Bell, Check, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../features/notification/hooks/useSocket";
import { AuthContext } from "../../app/context/AuthContext";
import api from "../services/axios";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "../hooks/useFriend";
import { getLocalizedNotificationText } from "../utils/notificationLocalization";
import "./NotificationBell.css";

const NotificationBell = () => {
  const { token } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("notification");
  const [processedNotifications, setProcessedNotifications] = useState([]);

  const { mutate: acceptFriendRequest } = useAcceptFriendRequest();
  const { mutate: rejectFriendRequest } = useRejectFriendRequest();

  const { data: allNotifications, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/web/notifications");
      return response.data.data;
    },
    enabled: !!token,
    refetchInterval: 60000,
  });

  useNotifications(() => {
    setUnreadCount((prev) => prev + 1);
    refetchNotifications();
  });

  useEffect(() => {
    if (allNotifications) {
      const unread = allNotifications.filter(
        (notification) => !notification.isRead,
      );
      setUnreadCount(unread.length);
    }
  }, [allNotifications]);

  const notificationMessages =
    allNotifications?.filter(
      (notification) =>
        !processedNotifications.includes(notification._id) &&
        (notification.type === "postLiked" ||
          notification.type === "postCommented" ||
          notification.type === "post_commented" ||
          notification.type === "commentReplied" ||
          notification.type === "comment_replied" ||
          notification.type === "ticketReplied" ||
          notification.type === "ticket_replied" ||
          notification.type === "report_processed" ||
          notification.type === "friend_accepted" ||
          notification.type === "friend_rejected" ||
          notification.type === "announcement"),
    ) || [];

  const friendRequests =
    allNotifications?.filter(
      (notification) =>
        !processedNotifications.includes(notification._id) &&
        (notification.type === "friendRequest" ||
          notification.type === "friend_request"),
    ) || [];

  const unreadNotificationCount = notificationMessages.filter(
    (notification) => !notification.isRead,
  ).length;
  const unreadFriendRequestCount = friendRequests.filter(
    (notification) => !notification.isRead,
  ).length;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/web/notifications/${notificationId}/read`);
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/web/notifications/read-all");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
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

    const requestData = {
      ...(friendshipId && { friendshipId }),
      ...(relatedUserId && !friendshipId && { relatedUserId }),
    };

    console.log("Sending request data:", requestData);

    acceptFriendRequest(requestData, {
      onSuccess: () => {
        setProcessedNotifications((prev) => [...prev, notification._id]);
        handleMarkAsRead(notification._id);
        refetchNotifications();
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

    const requestData = {
      ...(friendshipId && { friendshipId }),
      ...(relatedUserId && !friendshipId && { relatedUserId }),
    };

    rejectFriendRequest(requestData, {
      onSuccess: () => {
        setProcessedNotifications((prev) => [...prev, notification._id]);
        handleMarkAsRead(notification._id);
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
        title={t("notifications.title")}
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
              {t("notifications.tabs.notifications")}
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
              {t("notifications.tabs.friendRequests")}
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
                notificationMessages.slice(0, 5).map((notification) => {
                  const { title, message, contextLines } =
                    getLocalizedNotificationText(
                      notification,
                      t,
                      i18n.language,
                    );

                  return (
                    <div
                      key={notification._id}
                      className="notification-item"
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <div className="notification-content">
                        <p className="notification-title">{title}</p>
                        <p className="notification-message">{message}</p>
                        {contextLines.length > 0 && (
                          <div className="notification-context">
                            {contextLines.map((line, index) => (
                              <p
                                key={`${notification._id}-${index}-${line.label}-${line.value}`}
                                className="notification-context-line"
                              >
                                {line.label ? (
                                  <>
                                    <span className="notification-context-label">
                                      {line.label}:
                                    </span>{" "}
                                    <span className="notification-context-value">
                                      {line.value}
                                    </span>
                                  </>
                                ) : (
                                  line.value
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleString(
                            i18n.language?.startsWith("vi") ? "vi-VN" : "en-US",
                          )}
                        </span>
                      </div>
                      {!notification.isRead && (
                        <div className="notification-dot"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="notification-empty">
                  <p>{t("notifications.emptyNotifications")}</p>
                </div>
              )
            ) : friendRequests.length > 0 ? (
              friendRequests.slice(0, 5).map((notification) => {
                const { title, message, contextLines } =
                  getLocalizedNotificationText(notification, t, i18n.language);

                return (
                  <div
                    key={notification._id}
                    className="notification-item friend-request-item"
                  >
                    <div className="notification-content">
                      <p className="notification-title">{title}</p>
                      <p className="notification-message">{message}</p>
                      {contextLines.length > 0 && (
                        <div className="notification-context">
                          {contextLines.map((line, index) => (
                            <p
                              key={`${notification._id}-${index}-${line.label}-${line.value}`}
                              className="notification-context-line"
                            >
                              {line.label ? (
                                <>
                                  <span className="notification-context-label">
                                    {line.label}:
                                  </span>{" "}
                                  <span className="notification-context-value">
                                    {line.value}
                                  </span>
                                </>
                              ) : (
                                line.value
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString(
                          i18n.language?.startsWith("vi") ? "vi-VN" : "en-US",
                        )}
                      </span>
                    </div>
                    {(notification.type === "friend_request" ||
                      notification.type === "friendRequest") && (
                      <div className="friend-request-actions">
                        <button
                          className="btn-accept"
                          onClick={() =>
                            handleAcceptFriendRequest(notification)
                          }
                          title={t("notifications.accept")}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() =>
                            handleRejectFriendRequest(notification)
                          }
                          title={t("notifications.reject")}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {!notification.isRead && (
                      <div className="notification-dot"></div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="notification-empty">
                <p>{t("notifications.emptyFriendRequests")}</p>
              </div>
            )}
          </div>

          <div className="notification-info">
            <p>{t("notifications.autoDeleteNote")}</p>
            <button
              className="read-all-btn"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              {t("notifications.readAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
