import { BellOutlined, CreditCardOutlined, ShoppingOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Empty,
  List,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getMyNotificationsAPI,
  getUnreadNotificationCountAPI,
  markAllNotificationsReadAPI,
  markNotificationReadAPI,
} from '@/services/api';
import './notifications.page.scss';
import { getCurrentPath } from '@/utils/navigation';

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

const formatDateTime = (date?: string) => {
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

const getNotificationIcon = (type: IUserNotification['type']) => {
  if (type === 'PAYMENT_SUCCESS') {
    return <CreditCardOutlined />;
  }

  return <ShoppingOutlined />;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<IUserNotification[]>([]);
  const requestSeqRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const isReadFilter = useMemo(() => {
    if (filter === 'unread') {
      return false;
    }

    return undefined;
  }, [filter]);

  const fetchNotifications = async (page = 1, mode: 'reset' | 'append' = 'reset') => {
    const requestId = requestSeqRef.current + 1;
    requestSeqRef.current = requestId;

    if (mode === 'append') {
      setLoadMoreLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const [notificationRes, unreadCountRes] = await Promise.all([
        getMyNotificationsAPI(page, PAGE_SIZE, isReadFilter),
        getUnreadNotificationCountAPI(),
      ]);

      if (requestSeqRef.current !== requestId) {
        return;
      }

      const newItems = notificationRes.data?.result || [];
      const total = notificationRes.data?.meta?.total || 0;
      const unreadTotal = unreadCountRes.data?.total || 0;

      setNotifications((prev) => {
        if (mode === 'append') {
          return [...prev, ...newItems];
        }

        return newItems;
      });

      setTotalNotifications(total);
      setUnreadCount(unreadTotal);
      setCurrentPage(page);
      setHasMore(page * PAGE_SIZE < total);
    } catch {
      if (requestSeqRef.current === requestId) {
        message.error('Không thể tải danh sách thông báo');
      }
    } finally {
      if (requestSeqRef.current === requestId) {
        setLoading(false);
        setLoadMoreLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNotifications(1, 'reset');
  }, [isReadFilter]);

  const handleChangeFilter = (value: string | number) => {
    const nextFilter = value as 'all' | 'unread';

    if (nextFilter === filter) {
      return;
    }

    requestSeqRef.current += 1;
    setLoading(true);
    setFilter(nextFilter);
    setCurrentPage(1);
    setHasMore(false);
  };

  const handleLoadMore = () => {
    if (loadMoreLoading || !hasMore) {
      return;
    }

    fetchNotifications(currentPage + 1, 'append');
  };

  const handleReadNotification = async (notification: IUserNotification) => {
    try {
      if (!notification.isRead) {
        await markNotificationReadAPI(notification._id);

        setUnreadCount((prev) => Math.max(prev - 1, 0));

        if (filter === 'unread') {
          setNotifications((prev) => prev.filter((item) => item._id !== notification._id));
          setTotalNotifications((prev) => Math.max(prev - 1, 0));
        } else {
          setNotifications((prev) =>
            prev.map((item) =>
              item._id === notification._id
                ? {
                    ...item,
                    isRead: true,
                    readAt: new Date().toISOString(),
                  }
                : item,
            ),
          );
        }
      }

      if (notification.orderId) {
        navigate(`/orders/${notification.orderId}`, {
          state: {
            from: getCurrentPath(location),
            fromLabel: 'thông báo',
          },
        });
      }
    } catch {
      message.error('Không thể cập nhật trạng thái thông báo');
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      return;
    }

    setMarkAllLoading(true);

    try {
      await markAllNotificationsReadAPI();

      setUnreadCount(0);

      if (filter === 'unread') {
        setNotifications([]);
        setTotalNotifications(0);
        setHasMore(false);
      } else {
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        );
      }

      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch {
      message.error('Không thể đánh dấu tất cả thông báo');
    } finally {
      setMarkAllLoading(false);
    }
  };

  return (
    <main className="notifications-page">
      <section className="notifications-page__container">
        <div className="notifications-page__header">
          <div>
            <Space size={10}>
              <div className="notifications-page__title-icon">
                <BellOutlined />
              </div>

              <div>
                <Title level={2}>Thông báo</Title>
                <Text type="secondary">Theo dõi cập nhật đơn hàng và thanh toán của bạn</Text>
              </div>
            </Space>
          </div>

          <Button
            loading={markAllLoading}
            disabled={unreadCount === 0 || loading}
            onClick={handleMarkAllRead}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </div>

        <Card className="notifications-page__card">
          <div className="notifications-page__toolbar">
            <Segmented
              value={filter}
              onChange={handleChangeFilter}
              options={[
                {
                  label: 'Tất cả',
                  value: 'all',
                },
                {
                  label: 'Chưa đọc',
                  value: 'unread',
                },
              ]}
            />

            <Text type="secondary">
              {loading ? 'Đang tải...' : `${totalNotifications} thông báo`}
            </Text>
          </div>

          <div className="notifications-page__body">
            {loading ? (
              <div className="notifications-page__loading-state">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="notifications-page__empty-state">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    filter === 'unread'
                      ? 'Bạn không có thông báo chưa đọc'
                      : 'Bạn chưa có thông báo nào'
                  }
                />
              </div>
            ) : (
              <>
                <List
                  className="notifications-page__list"
                  dataSource={notifications}
                  renderItem={(notification) => (
                    <List.Item
                      className={`notifications-page__item ${
                        notification.isRead ? '' : 'notifications-page__item--unread'
                      }`}
                      onClick={() => handleReadNotification(notification)}
                    >
                      <div className="notifications-page__item-inner">
                        <Avatar
                          size={52}
                          className={`notifications-page__avatar notifications-page__avatar--${notification.type.toLowerCase()}`}
                          icon={getNotificationIcon(notification.type)}
                        />

                        <div className="notifications-page__content">
                          <div className="notifications-page__content-top">
                            <Text strong className="notifications-page__item-title">
                              {notification.title}
                            </Text>

                            {!notification.isRead && (
                              <span className="notifications-page__unread-dot" />
                            )}
                          </div>

                          <Text className="notifications-page__message">
                            {notification.message}
                          </Text>

                          <div className="notifications-page__meta">
                            <Text type="secondary">{formatDateTime(notification.createdAt)}</Text>

                            {notification.orderCode && (
                              <Tag color="blue">#{notification.orderCode}</Tag>
                            )}
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />

                <div className="notifications-page__load-more">
                  {hasMore ? (
                    <Button block loading={loadMoreLoading} onClick={handleLoadMore}>
                      Xem thông báo cũ hơn
                    </Button>
                  ) : (
                    <Text type="secondary">Bạn đã xem hết thông báo</Text>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
};

export default NotificationsPage;
