import { io, Socket } from 'socket.io-client';

let notificationSocket: Socket | null = null;

type NotificationUnreadCountPayload = {
  unreadCount: number;
};

type NotificationNewPayload = {
  notification: unknown;
  unreadCount: number;
};

const getSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

  return baseUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
};

const dispatchUnreadCount = (unreadCount: number) => {
  window.dispatchEvent(
    new CustomEvent<NotificationUnreadCountPayload>('notifications:unread-count', {
      detail: {
        unreadCount,
      },
    }),
  );
};

const dispatchAdminNewOrder = (payload: IAdminNewOrderSocketPayload) => {
  window.dispatchEvent(
    new CustomEvent<IAdminNewOrderSocketPayload>('admin:order:new', {
      detail: payload,
    }),
  );
};

const dispatchAdminOrderUpdated = (payload: IAdminOrderUpdatedSocketPayload) => {
  window.dispatchEvent(
    new CustomEvent<IAdminOrderUpdatedSocketPayload>('admin:order:updated', {
      detail: payload,
    }),
  );
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

  notificationSocket.on('notification:new', (payload: NotificationNewPayload) => {
    if (typeof payload?.unreadCount === 'number') {
      dispatchUnreadCount(payload.unreadCount);
    }
  });

  notificationSocket.on('admin:order:updated', (payload: IAdminOrderUpdatedSocketPayload) => {
    dispatchAdminOrderUpdated(payload);
  });

  notificationSocket.on('notification:unread-count', (payload: NotificationUnreadCountPayload) => {
    if (typeof payload?.unreadCount === 'number') {
      dispatchUnreadCount(payload.unreadCount);
    }
  });

  notificationSocket.on('admin:order:new', (payload: IAdminNewOrderSocketPayload) => {
    dispatchAdminNewOrder(payload);
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
