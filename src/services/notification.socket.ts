import { io, Socket } from 'socket.io-client';

let notificationSocket: Socket | null = null;

const getSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

  return baseUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
};

const dispatchNotificationRefresh = () => {
  window.dispatchEvent(new CustomEvent('notifications:refresh'));
};

export const connectNotificationSocket = () => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return;
  }

  if (notificationSocket?.connected) {
    return;
  }

  if (notificationSocket) {
    notificationSocket.removeAllListeners();
    notificationSocket.disconnect();
  }

  notificationSocket = io(`${getSocketUrl()}/notifications`, {
    auth: {
      token,
    },
    transports: ['websocket'],
    withCredentials: true,
  });

  notificationSocket.on('notification:new', () => {
    dispatchNotificationRefresh();
  });

  notificationSocket.on('notification:unread-count', () => {
    dispatchNotificationRefresh();
  });

  notificationSocket.on('connect_error', (error) => {
    console.log('[Notification socket error]', error.message);
  });
};

export const disconnectNotificationSocket = () => {
  if (!notificationSocket) {
    return;
  }

  notificationSocket.removeAllListeners();
  notificationSocket.disconnect();
  notificationSocket = null;
};
