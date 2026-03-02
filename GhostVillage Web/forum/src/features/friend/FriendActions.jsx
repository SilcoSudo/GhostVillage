import { useState } from "react";
import {
  useFriendshipStatus,
  useAddFriend,
  useUnfriend,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from "../../shared/hooks/useFriend.js";
import UnfriendConfirmModal from "./UnfriendConfirmModal.jsx";
import "./FriendActions.css";

/**
 * FriendActions Component
 * Displays appropriate friend action button based on relationship status
 *
 * @param {string} targetUserId - ID of the user to perform action on
 * @param {boolean} compact - If true, show icon-only buttons (default: false)
 * @param {object} preloadedStatus - Optional pre-fetched status (from profile API)
 */
const FriendActions = ({
  targetUserId,
  compact = false,
  preloadedStatus = null,
}) => {
  // Use preloaded status if provided, otherwise fetch
  const shouldFetch = !preloadedStatus;
  const { data: fetchedStatus, isLoading } = useFriendshipStatus(
    targetUserId,
    { enabled: shouldFetch }, // Only fetch if no preloaded status
  );
  const status = preloadedStatus || fetchedStatus;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { mutate: addFriend, isPending: isAdding } = useAddFriend();
  const { mutate: unfriend, isPending: isUnfriending } = useUnfriend();
  const { mutate: acceptRequest, isPending: isAccepting } =
    useAcceptFriendRequest();
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectFriendRequest();

  const isLoadingAction =
    isAdding ||
    isUnfriending ||
    isAccepting ||
    isRejecting ||
    (isLoading && !preloadedStatus);

  const handleUnfriend = () => {
    setIsConfirmOpen(true);
  };

  const handleCancelUnfriend = () => {
    setIsConfirmOpen(false);
  };

  const handleConfirmUnfriend = () => {
    setIsConfirmOpen(false);
    unfriend(targetUserId);
  };

  // Show Add Friend button while loading friendship status (if no preloaded status)
  if (isLoading && !preloadedStatus && !status) {
    return (
      <button
        className={`friend-btn add-friend ${compact ? "compact" : ""}`}
        disabled={true}
        title="Loading..."
      >
        {compact ? (
          <i className="fas fa-user-plus"></i>
        ) : (
          <>
            <i className="fas fa-user-plus"></i> Add Friend
          </>
        )}
      </button>
    );
  }

  // No relationship
  if (!status) {
    return (
      <button
        className={`friend-btn add-friend ${compact ? "compact" : ""}`}
        onClick={() => addFriend(targetUserId)}
        disabled={isLoadingAction}
        title="Add Friend"
      >
        {compact ? (
          <i className="fas fa-user-plus"></i>
        ) : (
          <>
            <i className="fas fa-user-plus"></i> Add Friend
          </>
        )}
      </button>
    );
  }

  // Already friends
  if (status.status === "accepted") {
    return (
      <>
        <button
          className={`friend-btn unfriend ${compact ? "compact" : ""}`}
          onClick={handleUnfriend}
          disabled={isLoadingAction}
          title="Unfriend"
        >
          {compact ? (
            <i className="fas fa-user-minus"></i>
          ) : (
            <>
              <i className="fas fa-user-minus"></i> Unfriend
            </>
          )}
        </button>

        <UnfriendConfirmModal
          isOpen={isConfirmOpen}
          onCancel={handleCancelUnfriend}
          onConfirm={handleConfirmUnfriend}
          isLoading={isUnfriending}
        />
      </>
    );
  }

  // Pending request (outgoing - we sent the request)
  if (status.status === "pending" && status.requestedBy === "self") {
    return (
      <button
        className={`friend-btn pending ${compact ? "compact" : ""}`}
        disabled={true}
        title="Request Pending"
      >
        {compact ? (
          <i className="fas fa-hourglass-half"></i>
        ) : (
          <>
            <i className="fas fa-hourglass-half"></i> Pending
          </>
        )}
      </button>
    );
  }

  // Pending request (incoming - they sent the request)
  if (status.status === "pending" && status.requestedBy === "other") {
    return (
      <div className="friend-actions-group">
        <button
          className={`friend-btn accept ${compact ? "compact" : ""}`}
          onClick={() => {
            // Note: This would need the friendshipId, not just userId
            // In a real app, you'd get this from the relationship data
            console.log("Accept request");
          }}
          disabled={isLoadingAction}
          title="Accept Request"
        >
          {compact ? (
            <i className="fas fa-check"></i>
          ) : (
            <>
              <i className="fas fa-check"></i> Accept
            </>
          )}
        </button>
        <button
          className={`friend-btn reject ${compact ? "compact" : ""}`}
          onClick={() => {
            // Note: This would need the friendshipId, not just userId
            console.log("Reject request");
          }}
          disabled={isLoadingAction}
          title="Reject Request"
        >
          {compact ? (
            <i className="fas fa-times"></i>
          ) : (
            <>
              <i className="fas fa-times"></i> Reject
            </>
          )}
        </button>
      </div>
    );
  }

  return null;
};

export default FriendActions;
