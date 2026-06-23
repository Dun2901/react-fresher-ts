import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Empty,
  Grid,
  List,
  Popconfirm,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  CreditCardOutlined,
  DownOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { cancelOrderAPI, createVnpayPaymentUrlAPI, getMyOrdersAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './current.order.scss';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const CURRENT_ORDER_STATUSES: IOrder['status'][] = ['PENDING', 'CONFIRMED', 'SHIPPING'];

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [2, 3, 5, 10];

const orderStatusMap: Record<IOrder['status'], { text: string; color: string; message: string }> = {
  PENDING: {
    text: 'Chờ xác nhận',
    color: 'gold',
    message: 'Đơn hàng đang chờ admin xác nhận.',
  },
  CONFIRMED: {
    text: 'Đã xác nhận',
    color: 'blue',
    message: 'Đơn hàng đã được xác nhận và đang chuẩn bị giao.',
  },
  SHIPPING: {
    text: 'Đang giao',
    color: 'processing',
    message: 'Đơn hàng đang được giao đến bạn.',
  },
  COMPLETED: {
    text: 'Hoàn thành',
    color: 'success',
    message: 'Đơn hàng đã hoàn thành.',
  },
  CANCELLED: {
    text: 'Đã hủy',
    color: 'error',
    message: 'Đơn hàng đã bị hủy.',
  },
};

const paymentMethodMap: Record<IOrder['paymentMethod'], string> = {
  COD: 'Thanh toán khi nhận hàng',
  ONLINE: 'VNPay',
};

const paymentStatusMap: Record<IOrder['paymentStatus'], { text: string; color: string }> = {
  UNPAID: {
    text: 'Chưa thanh toán',
    color: 'warning',
  },
  PAID: {
    text: 'Đã thanh toán',
    color: 'success',
  },
  REFUNDED: {
    text: 'Đã hoàn tiền',
    color: 'default',
  },
};

const formatDateTime = (date?: string) => {
  if (!date) {
    return '---';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

const getOrderItemsCount = (order: IOrder) => {
  return order.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
};

const getPreviewItems = (order: IOrder, limit = 2) => {
  return order.items?.slice(0, limit) ?? [];
};

const getRemainItemsCount = (order: IOrder, limit = 2) => {
  const totalTypes = order.items?.length ?? 0;

  return totalTypes > limit ? totalTypes - limit : 0;
};

const canRepayOrder = (order: IOrder) => {
  return (
    order.status === 'PENDING' &&
    order.paymentMethod === 'ONLINE' &&
    order.paymentStatus === 'UNPAID'
  );
};

const getErrorMessage = (error: any, fallbackMessage: string) => {
  const responseMessage = error?.response?.data?.error?.message || error?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage[0] || fallbackMessage;
  }

  return responseMessage || error?.message || fallbackMessage;
};

const CurrentOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const pageTopRef = useRef<HTMLDivElement | null>(null);

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState('');
  const [payingOrderId, setPayingOrderId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  const pageSizeMenuItems: MenuProps['items'] = PAGE_SIZE_OPTIONS.map((size) => ({
    key: String(size),
    label: `${size} đơn / trang`,
  }));

  const handleViewBookDetail = useCallback(
    (bookId: string) => {
      navigate(`/book/${bookId}`, {
        state: {
          from: location.pathname + location.search,
          fromLabel: 'đơn hàng đang xử lý',
        },
      });
    },
    [location.pathname, location.search, navigate],
  );

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      const topPosition = pageTopRef.current
        ? pageTopRef.current.getBoundingClientRect().top + window.scrollY - 76
        : 0;

      window.scrollTo({
        top: Math.max(topPosition, 0),
        left: 0,
        behavior: 'auto',
      });
    });
  };

  const fetchCurrentOrders = async () => {
    setLoading(true);

    try {
      const res = await getMyOrdersAPI(1, 10);
      const allOrders = res.data?.result ?? [];

      const currentOrders = allOrders.filter((order: IOrder) =>
        CURRENT_ORDER_STATUSES.includes(order.status),
      );

      setOrders(currentOrders);
      setCurrentPage(1);
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tải danh sách đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelLoadingId(orderId);

    try {
      const res = await cancelOrderAPI(orderId);

      message.success(res.message || 'Hủy đơn hàng thành công');
      await fetchCurrentOrders();
      scrollToPageTop();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể hủy đơn hàng'));
    } finally {
      setCancelLoadingId('');
    }
  };

  const handleRepayOrder = async (orderId: string) => {
    setPayingOrderId(orderId);

    try {
      const res = await createVnpayPaymentUrlAPI(orderId);
      const paymentUrl = res.data?.paymentUrl;

      if (!paymentUrl) {
        throw new Error('Không nhận được URL thanh toán VNPay');
      }

      message.loading('Đang chuyển sang cổng thanh toán VNPay...', 2);
      window.location.href = paymentUrl;
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tạo lại link thanh toán'));
      setPayingOrderId('');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToPageTop();
  };

  const handlePageSizeChange: MenuProps['onClick'] = ({ key }) => {
    setPageSize(Number(key));
    setCurrentPage(1);
    scrollToPageTop();
  };

  const toggleOrderProducts = useCallback((orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  }, []);

  const handleReload = async () => {
    await fetchCurrentOrders();
    scrollToPageTop();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    fetchCurrentOrders();
  }, []);

  const columns: ColumnsType<IOrder> = useMemo(
    () => [
      {
        title: 'Đơn hàng',
        key: 'product',
        width: 360,
        render: (_, record) => {
          const isExpanded = !!expandedOrderIds[record._id];
          const previewItems = isExpanded ? (record.items ?? []) : getPreviewItems(record, 2);
          const remainItemsCount = getRemainItemsCount(record, 2);
          const totalItems = getOrderItemsCount(record);

          return (
            <div className="current-order__desktop-order">
              <Text className="current-order__code">{record.orderCode}</Text>

              <div className="current-order__desktop-products">
                {previewItems.map((item, index) => (
                  <div
                    key={`${record._id}-${item.bookId}-${index}`}
                    className="current-order__desktop-product"
                    onClick={() => handleViewBookDetail(item.bookId)}
                    title="Xem chi tiết sản phẩm"
                  >
                    <Avatar
                      shape="square"
                      size={48}
                      src={getBookImageUrl(item.thumbnail)}
                      className="current-order__product-image"
                    >
                      <ShoppingOutlined />
                    </Avatar>

                    <div className="current-order__product-info">
                      <Text className="current-order__product-name">{item.bookName}</Text>

                      <Text type="secondary" className="current-order__product-meta">
                        x{item.quantity} • {formatCurrency(item.price)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              <div className="current-order__desktop-meta">
                <Text type="secondary">{totalItems} cuốn sách</Text>

                {remainItemsCount > 0 && (
                  <Button
                    type="link"
                    className="current-order__more-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleOrderProducts(record._id);
                    }}
                  >
                    {isExpanded ? 'Thu gọn' : `Xem thêm ${remainItemsCount} sản phẩm`}
                  </Button>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: 'Ngày đặt',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 140,
        render: (createdAt: string) => (
          <Text className="current-order__date">{formatDateTime(createdAt)}</Text>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: IOrder['status']) => (
          <Tag className="current-order__tag" color={orderStatusMap[status].color}>
            {orderStatusMap[status].text}
          </Tag>
        ),
      },
      {
        title: 'Thanh toán',
        key: 'payment',
        width: 190,
        render: (_, record) => (
          <div className="current-order__payment">
            <Text className="current-order__payment-method">
              {paymentMethodMap[record.paymentMethod]}
            </Text>

            <Tag
              className="current-order__tag"
              color={paymentStatusMap[record.paymentStatus].color}
            >
              {paymentStatusMap[record.paymentStatus].text}
            </Tag>

            {canRepayOrder(record) && (
              <Button
                size="small"
                type="primary"
                icon={<CreditCardOutlined />}
                loading={payingOrderId === record._id}
                onClick={() => handleRepayOrder(record._id)}
                className="current-order__pay-btn"
              >
                Thanh toán lại
              </Button>
            )}
          </div>
        ),
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        width: 130,
        align: 'right',
        render: (totalPrice: number) => (
          <Text strong className="current-order__price">
            {formatCurrency(totalPrice)}
          </Text>
        ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 190,
        align: 'right',
        render: (_, record) => (
          <div className="current-order__actions">
            <Button size="middle" onClick={() => navigate(`/orders/${record._id}`)}>
              Chi tiết
            </Button>

            {record.status === 'PENDING' && (
              <Popconfirm
                title="Hủy đơn hàng"
                description="Bạn có chắc muốn hủy đơn hàng này không?"
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
                onConfirm={() => handleCancelOrder(record._id)}
              >
                <Button size="middle" danger loading={cancelLoadingId === record._id}>
                  Hủy
                </Button>
              </Popconfirm>
            )}
          </div>
        ),
      },
    ],
    [
      cancelLoadingId,
      expandedOrderIds,
      handleViewBookDetail,
      navigate,
      payingOrderId,
      toggleOrderProducts,
      handleCancelOrder,
    ],
  );

  const renderMobileOrderCard = (order: IOrder) => {
    const isExpanded = !!expandedOrderIds[order._id];
    const previewItems = isExpanded ? (order.items ?? []) : getPreviewItems(order, 2);
    const remainItemsCount = getRemainItemsCount(order, 2);
    const totalItems = getOrderItemsCount(order);
    const statusInfo = orderStatusMap[order.status];
    const paymentInfo = paymentStatusMap[order.paymentStatus];

    return (
      <List.Item className="current-order__mobile-list-item">
        <Card className="current-order__mobile-card">
          <div className="current-order__mobile-top">
            <div className="current-order__mobile-code-box">
              <Text className="current-order__mobile-code">{order.orderCode}</Text>
              <Text className="current-order__mobile-date">{formatDateTime(order.createdAt)}</Text>
            </div>

            <Tag className="current-order__mobile-status" color={statusInfo.color}>
              {statusInfo.text}
            </Tag>
          </div>

          <div className="current-order__mobile-message">
            <TruckOutlined />
            <span>{statusInfo.message}</span>
          </div>

          <div className="current-order__mobile-products">
            {previewItems.map((item, index) => (
              <div
                key={`${order._id}-${item.bookId}-${index}`}
                className="current-order__mobile-product"
                onClick={() => handleViewBookDetail(item.bookId)}
                title="Xem chi tiết sản phẩm"
              >
                <Avatar
                  shape="square"
                  size={58}
                  src={getBookImageUrl(item.thumbnail)}
                  className="current-order__mobile-image"
                >
                  <ShoppingOutlined />
                </Avatar>

                <div className="current-order__mobile-product-info">
                  <Text className="current-order__mobile-name">{item.bookName}</Text>

                  <div className="current-order__mobile-product-bottom">
                    <Text type="secondary" className="current-order__mobile-qty">
                      x{item.quantity}
                    </Text>

                    <Text className="current-order__mobile-item-price">
                      {formatCurrency(item.price)}
                    </Text>
                  </div>
                </div>
              </div>
            ))}

            {remainItemsCount > 0 && (
              <button
                type="button"
                className="current-order__mobile-more"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleOrderProducts(order._id);
                }}
              >
                {isExpanded ? 'Thu gọn' : `Xem thêm ${remainItemsCount} sản phẩm`}
              </button>
            )}
          </div>

          <div className="current-order__mobile-info-box">
            <div className="current-order__mobile-info-row">
              <span>Phương thức</span>
              <b>{paymentMethodMap[order.paymentMethod]}</b>
            </div>

            <div className="current-order__mobile-info-row">
              <span>Thanh toán</span>
              <Tag className="current-order__payment-tag" color={paymentInfo.color}>
                {paymentInfo.text}
              </Tag>
            </div>
          </div>

          <div className="current-order__mobile-total">
            <span>Tổng số tiền ({totalItems} cuốn sách)</span>
            <b>{formatCurrency(order.totalPrice)}</b>
          </div>

          <div className="current-order__mobile-actions">
            {canRepayOrder(order) && (
              <Button
                type="primary"
                block
                icon={<CreditCardOutlined />}
                loading={payingOrderId === order._id}
                onClick={() => handleRepayOrder(order._id)}
                className="current-order__mobile-pay-btn"
              >
                Thanh toán lại
              </Button>
            )}

            <div className="current-order__mobile-secondary-actions">
              <Button onClick={() => navigate(`/orders/${order._id}`)}>Chi tiết</Button>

              {order.status === 'PENDING' && (
                <Popconfirm
                  title="Hủy đơn hàng"
                  description="Bạn có chắc muốn hủy đơn hàng này không?"
                  okText="Hủy đơn"
                  cancelText="Không"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleCancelOrder(order._id)}
                >
                  <Button danger loading={cancelLoadingId === order._id}>
                    Hủy
                  </Button>
                </Popconfirm>
              )}
            </div>
          </div>
        </Card>
      </List.Item>
    );
  };

  return (
    <div className="current-order" ref={pageTopRef}>
      <Card className="current-order__card">
        <div className="current-order__header">
          <div className="current-order__heading">
            <div className="current-order__icon">
              <ShoppingOutlined />
            </div>

            <div>
              <Title level={3} className="current-order__title">
                Đơn hàng đang xử lý
              </Title>

              <Text type="secondary" className="current-order__subtitle">
                Theo dõi đơn đang chờ xác nhận, đã xác nhận hoặc đang giao.
              </Text>
            </div>
          </div>

          <div className="current-order__header-actions">
            <Button onClick={() => navigate('/orders/history')}>Lịch sử</Button>

            <Button icon={<ReloadOutlined />} onClick={handleReload} loading={loading}>
              Tải lại
            </Button>
          </div>
        </div>

        <div className="current-order__toolbar">
          <div className="current-order__toolbar-left">
            <span>Tổng {orders.length} đơn hàng</span>
          </div>

          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: pageSizeMenuItems,
              selectedKeys: [String(pageSize)],
              onClick: handlePageSizeChange,
            }}
          >
            <Button className="current-order__page-size-btn">
              Hiển thị {pageSize} đơn / trang
              <DownOutlined />
            </Button>
          </Dropdown>
        </div>

        {isMobile ? (
          <List
            dataSource={orders}
            loading={loading}
            pagination={
              orders.length > pageSize
                ? {
                    current: currentPage,
                    pageSize,
                    size: 'small',
                    align: 'center',
                    showSizeChanger: false,
                    onChange: handlePageChange,
                  }
                : false
            }
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có đơn hàng nào đang xử lý."
                />
              ),
            }}
            renderItem={renderMobileOrderCard}
          />
        ) : (
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={orders}
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize,
              showSizeChanger: false,
              onChange: handlePageChange,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có đơn hàng nào đang xử lý."
                />
              ),
            }}
            scroll={{ x: 1120 }}
            className="current-order__table"
          />
        )}
      </Card>
    </div>
  );
};

export default CurrentOrderPage;
