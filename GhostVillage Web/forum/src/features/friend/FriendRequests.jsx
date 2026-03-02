import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import {
  usePendingFriendRequests,
  useSentFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "../../shared/hooks/useFriend.js";
import { getAvatarUrl, cacheAvatar } from "../../shared/utils/avatarCache";
import "./FriendRequests.css";

const FriendRequests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("incoming"); // incoming | outgoing

  const { data: pendingRequests, isLoading: loadingPending } =
    usePendingFriendRequests();
  const { data: sentRequests, isLoading: loadingSent } =
    useSentFriendRequests();
  const { mutate: acceptRequest } = useAcceptFriendRequest();
  const { mutate: rejectRequest } = useRejectFriendRequest();

  const isLoading = loadingPending || loadingSent;

  if (isLoading) {
    return (
      <div className="friend-requests">
        <div className="loading">
          <p>Loading friend requests...</p>
        </div>
      </div>
    );
  }

  const handleAccept = (friendshipId) => {
    acceptRequest(friendshipId);
  };

  const handleReject = (friendshipId) => {
    rejectRequest(friendshipId);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="friend-requests">
      <div className="friend-requests-header">
        <h2>Friend Requests</h2>
      </div>

      <div className="request-tabs">
        <button
          className={`tab-btn ${activeTab === "incoming" ? "active" : ""}`}
          onClick={() => setActiveTab("incoming")}
        >
          <i className="fas fa-inbox"></i> Incoming
          {pendingRequests && pendingRequests.length > 0 && (
            <span className="badge">{pendingRequests.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === "outgoing" ? "active" : ""}`}
          onClick={() => setActiveTab("outgoing")}
        >
          <i className="fas fa-paper-plane"></i> Outgoing
          {sentRequests && sentRequests.length > 0 && (
            <span className="badge">{sentRequests.length}</span>
          )}
        </button>
      </div>

      {activeTab === "incoming" && (
        <div className="requests-container">
          {!pendingRequests || pendingRequests.length === 0 ? (
            <div className="no-requests">
              <p>No incoming friend requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingRequests.map((request) => (
                <div key={request._id} className="request-item">
                  <div className="requester-info">
                    {request.userId?.avatar ? (
                      <img
                        src={getAvatarUrl(
                          request.userId._id,
                          request.userId.avatar,
                        )}
                        alt={request.userId?.fullname}
                        className="requester-avatar"
                        onLoad={() =>
                          cacheAvatar(request.userId._id, request.userId.avatar)
                        }
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="avatar-fallback-small">
                        <User size={20} strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="requester-details">
                      <h4>{request.userId?.fullname}</h4>
                      {request.userId?.bio && (
                        <p className="requester-bio">{request.userId.bio}</p>
                      )}
                      <span className="request-date">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="request-actions">
                    <button
                      className="btn btn-accept"
                      onClick={() => handleAccept(request._id)}
                    >
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleReject(request._id)}
                    >
                      <i className="fas fa-times"></i> Reject
                    </button>
                    <button
                      className="btn btn-view"
                      onClick={() => handleViewProfile(request.userId._id)}
                    >
                      <i className="fas fa-user"></i> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "outgoing" && (
        <div className="requests-container">
          {!sentRequests || sentRequests.length === 0 ? (
            <div className="no-requests">
              <p>No outgoing friend requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {sentRequests.map((request) => (
                <div key={request._id} className="request-item outgoing">
                  <div className="requester-info">
                    {request.friendId?.avatar ? (
                      <img
                        src={getAvatarUrl(
                          request.friendId._id,
                          request.friendId.avatar,
                        )}
                        alt={request.friendId?.fullname}
                        className="requester-avatar"
                        onLoad={() =>
                          cacheAvatar(
                            request.friendId._id,
                            request.friendId.avatar,
                          )
                        }
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="avatar-fallback-small">
                        <User size={24} />
                      </div>
                    )}
                    <div className="requester-details">
                      <h4>{request.friendId?.fullname}</h4>
                      {request.friendId?.bio && (
                        <p className="requester-bio">{request.friendId.bio}</p>
                      )}
                      <span className="request-date">
                        Sent{" "}
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="request-actions">
                    <span className="pending-badge">
                      <i className="fas fa-clock"></i> Pending
                    </span>
                    <button
                      className="btn btn-view"
                      onClick={() => handleViewProfile(request.friendId._id)}
                    >
                      <i className="fas fa-user"></i> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendRequests;
