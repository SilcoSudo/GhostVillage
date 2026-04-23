import { useEffect, useState } from "react";
import { onSocketEvent } from "../../features/notification/services/socketService.js";

const normalizeUserId = (userId) => String(userId);

export const useFriendPresence = () => {
  const [presenceByUserId, setPresenceByUserId] = useState(() => new Map());

  useEffect(() => {
    const handlePresenceSnapshot = ({ onlineUserIds = [] } = {}) => {
      const onlineUserIdSet = new Set(
        onlineUserIds.map((userId) => normalizeUserId(userId)),
      );

      setPresenceByUserId((prev) => {
        const next = new Map();

        for (const [userId, isOnline] of prev.entries()) {
          if (isOnline === false) {
            next.set(userId, false);
          }
        }

        onlineUserIdSet.forEach((userId) => {
          next.set(userId, true);
        });

        return next;
      });
    };

    const handlePresenceUpdate = ({ userId, isOnline } = {}) => {
      if (!userId) {
        return;
      }

      setPresenceByUserId((prev) => {
        const next = new Map(prev);
        next.set(normalizeUserId(userId), Boolean(isOnline));
        return next;
      });
    };

    const unsubscribeSnapshot = onSocketEvent(
      "presence:snapshot",
      handlePresenceSnapshot,
    );
    const unsubscribeUpdate = onSocketEvent(
      "user:presence",
      handlePresenceUpdate,
    );

    return () => {
      unsubscribeSnapshot();
      unsubscribeUpdate();
    };
  }, []);

  return presenceByUserId;
};
