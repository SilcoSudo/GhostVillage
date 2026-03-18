import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;
let listeners = {};

/**
 * Initialize Socket.IO connection
 * @param {string} token - JWT token from localStorage
 */
export const initSocket = (token) => {
  if (socket?.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('✓ Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('✗ Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Listen for notifications
  socket.on('new_notification', (data) => {
    console.log('📦 New notification:', data);
    notifyListeners('notification', data);
  });

  socket.on('new_announcement', (data) => {
    console.log('📢 New announcement:', data);
    notifyListeners('announcement', data);
  });

  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

/**
 * Subscribe to socket events
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
export const onNotification = (event, callback) => {
  if (!listeners[event]) {
    listeners[event] = [];
  }
  listeners[event].push(callback);

  // Return unsubscribe function
  return () => {
    listeners[event] = listeners[event].filter((cb) => cb !== callback);
  };
};

/**
 * Notify all listeners
 * @param {string} event - Event name
 * @param {*} data - Data to pass
 */
const notifyListeners = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${event}:`, error);
      }
    });
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = () => {
  return socket?.connected || false;
};

/**
 * Emit event (if needed)
 */
export const emitSocket = (event, data) => {
  if (socket) {
    socket.emit(event, data);
  }
};
