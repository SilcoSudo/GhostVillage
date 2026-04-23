const onlineUserConnections = new Map();

const normalizeUserId = (userId) => String(userId);

export const getOnlineUserIds = () => Array.from(onlineUserConnections.keys());

export const isUserOnline = (userId) =>
  onlineUserConnections.has(normalizeUserId(userId));

export const markUserOnline = (userId) => {
  const normalizedUserId = normalizeUserId(userId);
  const currentConnectionCount =
    onlineUserConnections.get(normalizedUserId) || 0;
  const nextConnectionCount = currentConnectionCount + 1;

  onlineUserConnections.set(normalizedUserId, nextConnectionCount);

  return {
    becameOnline: currentConnectionCount === 0,
    onlineUserIds: getOnlineUserIds(),
  };
};

export const markUserOffline = (userId) => {
  const normalizedUserId = normalizeUserId(userId);
  const currentConnectionCount =
    onlineUserConnections.get(normalizedUserId) || 0;

  if (currentConnectionCount <= 1) {
    const wasOnline = onlineUserConnections.delete(normalizedUserId);

    return {
      becameOffline: wasOnline,
      onlineUserIds: getOnlineUserIds(),
    };
  }

  onlineUserConnections.set(normalizedUserId, currentConnectionCount - 1);

  return {
    becameOffline: false,
    onlineUserIds: getOnlineUserIds(),
  };
};

export default {
  getOnlineUserIds,
  isUserOnline,
  markUserOnline,
  markUserOffline,
};
