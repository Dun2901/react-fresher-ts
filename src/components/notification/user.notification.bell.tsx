import { Badge, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadNotificationCountAPI } from '@/services/api';
import { useCurrentApp } from '@/components/context/app.context';

type UserNotificationBellProps = {
  variant?: 'header' | 'drawer';
  onNavigate?: () => void;
};

type NotificationUnreadCountPayload = {
  unreadCount: number;
};

const UserNotificationBell = ({ variant = 'header', onNavigate }: UserNotificationBellProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentApp();

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await getUnreadNotificationCountAPI();
      setUnreadCount(res.data?.total || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleUnreadCount = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationUnreadCountPayload>;
      const nextUnreadCount = customEvent.detail?.unreadCount;

      if (typeof nextUnreadCount === 'number') {
        setUnreadCount(nextUnreadCount);
      }
    };

    window.addEventListener('notifications:unread-count', handleUnreadCount);

    return () => {
      window.removeEventListener('notifications:unread-count', handleUnreadCount);
    };
  }, [isAuthenticated]);

  const handleGoToNotifications = () => {
    navigate('/notifications');
    onNavigate?.();
  };

  if (!isAuthenticated) {
    return null;
  }

  if (variant === 'drawer') {
    return (
      <p
        className="drawer-nav-item drawer-nav-item--notification"
        onClick={handleGoToNotifications}
      >
        <BellOutlined />
        <span className="drawer-nav-item__label">Thông báo</span>

        <Badge
          count={unreadCount}
          size="small"
          overflowCount={99}
          className="drawer-nav-item__badge"
        />
      </p>
    );
  }

  return (
    <Tooltip title="Thông báo">
      <div className="action-item-notification" onClick={handleGoToNotifications}>
        <Badge count={unreadCount} size="small" overflowCount={99}>
          <BellOutlined className="icon-notification-bell" />
        </Badge>
      </div>
    </Tooltip>
  );
};

export default UserNotificationBell;
