import { Badge, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnreadNotificationCountAPI } from '@/services/api';
import { useCurrentApp } from '@/components/context/app.context';

const UserNotificationBell = () => {
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

    const intervalId = window.setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tooltip title="Thông báo">
      <div className="action-item-notification" onClick={() => navigate('/notifications')}>
        <Badge count={unreadCount} size="small" overflowCount={99}>
          <BellOutlined className="icon-notification-bell" />
        </Badge>
      </div>
    </Tooltip>
  );
};

export default UserNotificationBell;
