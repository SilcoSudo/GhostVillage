import { useEffect, useState } from 'react';
import { initSocket, onNotification, disconnectSocket, isSocketConnected } from '../services/socketService';

/**
 * Hook để xử lý Socket.IO realtime notifications
 * @param {string} token - JWT token
 * @returns {object} - { isConnected, isSocketConnected }
 */
export const useSocket = (token) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Initialize socket
    const socket = initSocket(token);
    setIsConnected(socket.connected);

    // Listen for connection status
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    return () => {
      // Cleanup on unmount
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [token]);

  return {
    isConnected,
    isSocketConnected: isSocketConnected(),
  };
};

/**
 * Hook để listen notifications
 * @param {function} onNotificationReceived - Callback when notification arrives
 */
export const useNotifications = (onNotificationReceived) => {
  useEffect(() => {
    if (!onNotificationReceived) return;

    // Subscribe to notifications
    const unsubscribe = onNotification('notification', (data) => {
      onNotificationReceived(data);
    });

    return () => {
      unsubscribe();
    };
  }, [onNotificationReceived]);
};

/**
 * Hook để listen announcements
 * @param {function} onAnnouncementReceived - Callback when announcement arrives
 */
export const useAnnouncements = (onAnnouncementReceived) => {
  useEffect(() => {
    if (!onAnnouncementReceived) return;

    const unsubscribe = onNotification('announcement', (data) => {
      onAnnouncementReceived(data);
    });

    return () => {
      unsubscribe();
    };
  }, [onAnnouncementReceived]);
};
