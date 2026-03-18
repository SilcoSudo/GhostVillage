import { useContext, useEffect, useMemo, useState } from "react";
import { User } from "lucide-react";
import { ChatContext } from "../../app/context/ChatContext.jsx";
import { useFriendList, useUnfriend } from "../../shared/hooks/useFriend.js";
import { getAvatarUrl, cacheAvatar } from "../../shared/utils/avatarCache";
import UnfriendConfirmModal from "./UnfriendConfirmModal.jsx";
import "./FriendList.css";

const FriendList = () => {
  const { openChat } = useContext(ChatContext);
  const { data: friends, isLoading, error } = useFriendList();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [unreadByFriend, setUnreadByFriend] = useState({});
  const [latestMessageAtByFriend, setLatestMessageAtByFriend] = useState({});

  useEffect(() => {
    const handleNewMessage = (event) => {
      const senderId = event.detail?.senderId;
      if (!senderId) return;

      const createdAt = event.detail?.message?.createdAt;
      const messageTime = createdAt
        ? new Date(createdAt).getTime()
        : Date.now();

      setUnreadByFriend((prev) => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1,
      }));

      setLatestMessageAtByFriend((prev) => ({
        ...prev,
        [senderId]: Math.max(prev[senderId] || 0, messageTime),
      }));
    };

    window.addEventListener("chat:new-message", handleNewMessage);
    return () => {
      window.removeEventListener("chat:new-message", handleNewMessage);
    };
  }, []);

  const sortedFriends = useMemo(() => {
    if (!friends?.length) return [];

    return [...friends].sort((friendA, friendB) => {
      const unreadA = unreadByFriend[friendA._id] || 0;
      const unreadB = unreadByFriend[friendB._id] || 0;

      if (unreadA !== unreadB) {
        return unreadB - unreadA;
      }

      const latestA = latestMessageAtByFriend[friendA._id] || 0;
      const latestB = latestMessageAtByFriend[friendB._id] || 0;

      if (latestA !== latestB) {
        return latestB - latestA;
      }

      return (friendA.fullname || "").localeCompare(
        friendB.fullname || "",
        "vi",
        {
          sensitivity: "base",
        },
      );
    });
  }, [friends, unreadByFriend, latestMessageAtByFriend]);

  if (isLoading) {
    return (
      <div className="friend-list">
        <div className="loading">
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friend-list">
        <div className="error">
          <p>Error loading friends: {error.message}</p>
        </div>
      </div>
    );
  }

  const handleUnfriend = (event, friend) => {
    event.stopPropagation();
    setSelectedFriend(friend);
    setIsConfirmOpen(true);
  };

  const handleCancelUnfriend = () => {
    setIsConfirmOpen(false);
    setSelectedFriend(null);
  };

  const handleConfirmUnfriend = () => {
    if (!selectedFriend?._id) return;
    setIsConfirmOpen(false);
    unfriend(selectedFriend._id);
    setSelectedFriend(null);
  };

  const handleSendMessage = (friend) => {
    setUnreadByFriend((prev) => {
      if (!prev[friend._id]) return prev;
      const next = { ...prev };
      delete next[friend._id];
      return next;
    });
    openChat(friend);
  };

  return (
    <div className="friend-list">
      <div className="friend-list-header">
        <h2>My Friends</h2>
        <span className="friend-count">{friends?.length || 0} friends</span>
      </div>

      {!friends || friends.length === 0 ? (
        <div className="no-friends">
          <p>You don't have any friends yet.</p>
        </div>
      ) : (
        <div className="friends-list">
          {sortedFriends.map((friend) => (
            <div
              key={friend._id}
              className={`friend-item ${unreadByFriend[friend._id] ? "has-unread" : ""}`}
              onClick={() => handleSendMessage(friend)}
              title="Open chat"
            >
              <div className="friend-avatar-small">
                {friend.avatar ? (
                  <img
                    src={getAvatarUrl(friend._id, friend.avatar)}
                    alt={friend.fullname}
                    onLoad={() => cacheAvatar(friend._id, friend.avatar)}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="avatar-fallback">
                    <User size={18} strokeWidth={1.5} />
                  </div>
                )}
              </div>

              <div className="friend-info-small">
                <h4 className="friend-name-small">{friend.fullname}</h4>
                {unreadByFriend[friend._id] ? (
                  <span className="friend-unread-badge">
                    {unreadByFriend[friend._id] > 99
                      ? "99+"
                      : unreadByFriend[friend._id]}
                  </span>
                ) : null}
              </div>

              <div className="friend-actions-small">
                <button
                  className="btn-icon btn-danger"
                  onClick={(event) => handleUnfriend(event, friend)}
                  title="Unfriend"
                >
                  <i className="fas fa-user-minus"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UnfriendConfirmModal
        isOpen={isConfirmOpen}
        onCancel={handleCancelUnfriend}
        onConfirm={handleConfirmUnfriend}
        isLoading={isUnfriending}
        friendName={selectedFriend?.fullname}
      />
    </div>
  );
};

export default FriendList;
