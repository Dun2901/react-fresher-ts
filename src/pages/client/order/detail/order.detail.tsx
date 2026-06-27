import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Grid,
  List,
  Popconfirm,
  Skeleton,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  TruckOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cancelOrderAPI, createVnpayPaymentUrlAPI, getMyOrderByIdAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './order.detail.scss';
import { BackNavigationState, getBackButtonText, goBackOrFallback } from '@/utils/navigation';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const orderStatusMap: Record<
  IOrder['status'],
  {
    text: string;
    color: string;
    message: string;
    tone: 'warning' | 'info' | 'processing' | 'success' | 'error';
  }
> = {
  PENDING: {
    text: 'Chờ xác nhận',
    color: 'gold',
    message: 'Đơn hàng đang chờ admin xác nhận.',
    tone: 'warning',
  },
  CONFIRMED: {
    text: 'Đã xác nhận',
    color: 'blue',
    message: 'Đơn hàng đã được xác nhận và đang chuẩn bị giao.',
    tone: 'info',
  },
  SHIPPING: {
    text: 'Đang giao',
    color: 'processing',
    message: 'Đơn hàng đang được giao đến bạn.',
    tone: 'processing',
  },
  COMPLETED: {
    text: 'Hoàn thành',
    color: 'success',
    message: 'Đơn hàng đã hoàn thành. Cảm ơn bạn đã mua sách tại BookStore.',
    tone: 'success',
  },
  CANCELLED: {
    text: 'Đã hủy',
    color: 'error',
    message: 'Đơn hàng đã được hủy và không còn tiếp tục xử lý.',
    tone: 'error',
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

const orderStepItems = [
  {
    title: 'Chờ xác nhận',
  },
  {
    title: 'Đã xác nhận',
  },
  {
    title: 'Đang giao',
  },
  {
    title: 'Hoàn thành',
  },
];

const orderStepIndexMap: Partial<Record<IOrder['status'], number>> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPING: 2,
  COMPLETED: 3,
};

const formatDateTime = (date?: string) => {
  if (!date) return '---';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

const getErrorMessage = (error: any, fallbackMessage: string) => {
  const responseMessage =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.error?.message ||
    error?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage[0] || fallbackMessage;
  }

  return responseMessage || fallbackMessage;
};

const getOrderItems = (order?: IOrder) => {
  return order?.items ?? [];
};

const getOrderItemsCount = (order?: IOrder) => {
  return getOrderItems(order).reduce((total, item) => total + item.quantity, 0);
};

const getItemsSubtotal = (order?: IOrder) => {
  return getOrderItems(order).reduce((total, item) => total + item.price * item.quantity, 0);
};

const getShippingFee = (order?: IOrder) => {
  if (!order) return 0;

  const orderData = order as IOrder & { shippingFee?: number };
  const subtotal = getItemsSubtotal(order);

  if (typeof orderData.shippingFee === 'number') {
    return orderData.shippingFee;
  }

  return Math.max(order.totalPrice - subtotal, 0);
};

const getReceiverInfo = (order?: IOrder) => {
  const orderData = order as
    | (IOrder & {
        receiverName?: string;
        receiverPhone?: string;
        receiverAddress?: string;
      })
    | undefined;

  return {
    name: order?.shippingAddress?.fullName || orderData?.receiverName || '---',
    phone: order?.shippingAddress?.phone || orderData?.receiverPhone || '---',
    address: order?.shippingAddress?.address || orderData?.receiverAddress || '---',
  };
};

const getOrderStepCurrent = (status?: IOrder['status']) => {
  if (!status || status === 'CANCELLED') return 0;

  return orderStepIndexMap[status] ?? 0;
};

const isHistoryStatus = (status?: IOrder['status']) => {
  return status === 'COMPLETED' || status === 'CANCELLED';
};

const canCancelOrder = (order?: IOrder | null) => {
  return order?.status === 'PENDING';
};

const canRepayOrder = (order?: IOrder | null) => {
  return (
    order?.status === 'PENDING' &&
    order.paymentMethod === 'ONLINE' &&
    order.paymentStatus === 'UNPAID'
  );
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [payingLoading, setPayingLoading] = useState(false);

  const receiverInfo = useMemo(() => getReceiverInfo(order ?? undefined), [order]);
  const totalItems = useMemo(() => getOrderItemsCount(order ?? undefined), [order]);
  const itemsSubtotal = useMemo(() => getItemsSubtotal(order ?? undefined), [order]);
  const shippingFee = useMemo(() => getShippingFee(order ?? undefined), [order]);
  const orderItems = useMemo(() => getOrderItems(order ?? undefined), [order]);

  const statusInfo = order ? orderStatusMap[order.status] : undefined;
  const paymentStatusInfo = order ? paymentStatusMap[order.paymentStatus] : undefined;
  const showCancelButton = canCancelOrder(order);
  const showRepayButton = canRepayOrder(order);
  const showMobileStickyActions = isMobile && !!order && (showCancelButton || showRepayButton);

  const routeState = location.state as BackNavigationState;
  const isHistoryOrder = isHistoryStatus(order?.status);
  const backPath = isHistoryOrder ? '/orders/history' : '/orders';
  const fallbackBackLabel = isHistoryOrder ? 'lịch sử mua hàng' : 'đơn đang xử lý';

  const handleBack = () => {
    goBackOrFallback(navigate, backPath, routeState);
  };

  const backButtonText = getBackButtonText(routeState, fallbackBackLabel);

  const fetchOrderDetail = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const res = await getMyOrderByIdAPI(id);

      if (res.error) {
        throw res;
      }

      setOrder(res.data ?? null);
    } catch (error: any) {
      setOrder(null);
      message.error(getErrorMessage(error, 'Không thể tải chi tiết đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?._id) return;

    setCancelLoading(true);

    try {
      const res = await cancelOrderAPI(order._id);

      message.success(res.message || 'Hủy đơn hàng thành công');
      await fetchOrderDetail();
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể hủy đơn hàng'));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRepayOrder = async () => {
    if (!order?._id) return;

    setPayingLoading(true);

    try {
      const res = await createVnpayPaymentUrlAPI(order._id);
      const paymentUrl = res.data?.paymentUrl;

      if (!paymentUrl) {
        throw new Error('Không nhận được URL thanh toán VNPay');
      }

      message.loading('Đang chuyển sang cổng thanh toán VNPay...', 2);
      window.location.href = paymentUrl;
    } catch (error: any) {
      message.error(getErrorMessage(error, 'Không thể tạo lại link thanh toán'));
      setPayingLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    fetchOrderDetail();
  }, [id]);

  const columns: ColumnsType<IOrderItem> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <div className="order-detail__product">
          <Avatar
            shape="square"
            size={64}
            src={getBookImageUrl(record.thumbnail)}
            className="order-detail__product-image"
          >
            <ShoppingOutlined />
          </Avatar>

          <div className="order-detail__product-info">
            <Text strong className="order-detail__product-name">
              {record.bookName}
            </Text>

            <Text type="secondary" className="order-detail__product-meta">
              Mã sách: {record.bookId}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (price: number) => <Text>{formatCurrency(price)}</Text>,
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'center',
      render: (quantity: number) => <Text>x{quantity}</Text>,
    },
    {
      title: 'Thành tiền',
      key: 'subtotal',
      width: 150,
      align: 'right',
      render: (_, record) => (
        <Text strong className="order-detail__price">
          {formatCurrency(record.price * record.quantity)}
        </Text>
      ),
    },
  ];

  if (loading && !order) {
    return (
      <div className="order-detail order-detail--loading">
        <Card className="order-detail__shell">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail">
        <Card className="order-detail__shell order-detail__empty-card">
          <Empty description="Không tìm thấy đơn hàng" />
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Về đơn hàng của tôi
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`order-detail ${showMobileStickyActions ? 'order-detail--has-sticky' : ''}`}>
      <Card className="order-detail__shell">
        <div className="order-detail__header">
          <div className="order-detail__header-left">
            <Space className="order-detail__breadcrumb" size={8} wrap>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                {backButtonText}
              </Button>

              {!isMobile && (
                <>
                  <Button icon={<TruckOutlined />} onClick={() => navigate('/orders')}>
                    Đơn đang xử lý
                  </Button>

                  <Button icon={<HistoryOutlined />} onClick={() => navigate('/orders/history')}>
                    Lịch sử mua hàng
                  </Button>
                </>
              )}
            </Space>

            <div className="order-detail__heading">
              <div className="order-detail__icon">
                <ShoppingOutlined />
              </div>

              <div className="order-detail__heading-content">
                <Title level={3} className="order-detail__title">
                  Chi tiết đơn hàng
                </Title>

                <Text type="secondary" className="order-detail__subtitle">
                  Mã đơn hàng: {order.orderCode}
                </Text>
              </div>
            </div>
          </div>

          <Space className="order-detail__header-actions" wrap>
            <Button icon={<ReloadOutlined />} onClick={fetchOrderDetail} loading={loading}>
              Tải lại
            </Button>

            {!isMobile && showRepayButton && (
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                loading={payingLoading}
                onClick={handleRepayOrder}
              >
                Thanh toán lại
              </Button>
            )}

            {!isMobile && showCancelButton && (
              <Popconfirm
                title="Hủy đơn hàng"
                description="Bạn có chắc muốn hủy đơn hàng này không?"
                okText="Hủy đơn"
                cancelText="Không"
                okButtonProps={{ danger: true }}
                onConfirm={handleCancelOrder}
              >
                <Button danger icon={<CloseCircleOutlined />} loading={cancelLoading}>
                  Hủy đơn hàng
                </Button>
              </Popconfirm>
            )}
          </Space>
        </div>

        <div className={`order-detail__status-card order-detail__status-card--${statusInfo?.tone}`}>
          <div className="order-detail__status-main">
            {order.status === 'CANCELLED' ? (
              <CloseCircleOutlined className="order-detail__status-icon order-detail__status-icon--cancelled" />
            ) : (
              <CheckCircleOutlined className="order-detail__status-icon" />
            )}

            <div className="order-detail__status-content">
              <div className="order-detail__status-title-row">
                <Text strong className="order-detail__status-title">
                  {statusInfo?.text}
                </Text>

                <Tag color={statusInfo?.color} className="order-detail__tag">
                  {statusInfo?.text}
                </Tag>
              </div>

              <Text className="order-detail__status-desc">{statusInfo?.message}</Text>
            </div>
          </div>

          {order.status !== 'CANCELLED' && (
            <>
              {isMobile ? (
                <div className="order-detail__mobile-progress">
                  {orderStepItems.map((step, index) => (
                    <div
                      key={step.title}
                      className={`order-detail__mobile-progress-item ${
                        index <= getOrderStepCurrent(order.status)
                          ? 'order-detail__mobile-progress-item--active'
                          : ''
                      }`}
                    >
                      <span className="order-detail__mobile-progress-number">{index + 1}</span>
                      <Text className="order-detail__mobile-progress-text">{step.title}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Steps
                  current={getOrderStepCurrent(order.status)}
                  items={orderStepItems}
                  className="order-detail__steps"
                />
              )}
            </>
          )}
        </div>

        <div className="order-detail__info-grid">
          <Card className="order-detail__section-card">
            <div className="order-detail__section-heading">
              <UserOutlined />
              <span>Thông tin người nhận</span>
            </div>

            <div className="order-detail__info-list">
              <div className="order-detail__info-row">
                <Text type="secondary">Họ tên</Text>
                <Text strong>{receiverInfo.name}</Text>
              </div>

              <div className="order-detail__info-row">
                <Text type="secondary">Số điện thoại</Text>
                <Text strong>{receiverInfo.phone}</Text>
              </div>

              <div className="order-detail__info-row order-detail__info-row--address">
                <Text type="secondary">Địa chỉ</Text>
                <Text>{receiverInfo.address}</Text>
              </div>
            </div>
          </Card>

          <Card className="order-detail__section-card">
            <div className="order-detail__section-heading">
              <CreditCardOutlined />
              <span>Thông tin thanh toán</span>
            </div>

            <div className="order-detail__info-list">
              <div className="order-detail__info-row">
                <Text type="secondary">Phương thức</Text>
                <Text strong>{paymentMethodMap[order.paymentMethod]}</Text>
              </div>

              <div className="order-detail__info-row">
                <Text type="secondary">Trạng thái</Text>
                <Tag color={paymentStatusInfo?.color} className="order-detail__tag">
                  {paymentStatusInfo?.text}
                </Tag>
              </div>

              <div className="order-detail__info-row">
                <Text type="secondary">Ngày đặt</Text>
                <Text>{formatDateTime(order.createdAt)}</Text>
              </div>
            </div>
          </Card>

          <Card className="order-detail__section-card order-detail__summary-card">
            <div className="order-detail__section-heading">
              <WalletOutlined />
              <span>Tóm tắt đơn hàng</span>
            </div>

            <div className="order-detail__info-list">
              <div className="order-detail__info-row">
                <Text type="secondary">Số lượng sách</Text>
                <Text strong>{totalItems} cuốn</Text>
              </div>

              <div className="order-detail__info-row">
                <Text type="secondary">Tạm tính</Text>
                <Text>{formatCurrency(itemsSubtotal)}</Text>
              </div>

              <div className="order-detail__info-row">
                <Text type="secondary">Phí vận chuyển</Text>
                <Text>{formatCurrency(shippingFee)}</Text>
              </div>

              <div className="order-detail__info-row order-detail__info-row--total">
                <Text strong>Tổng thanh toán</Text>
                <Text strong className="order-detail__total-price">
                  {formatCurrency(order.totalPrice)}
                </Text>
              </div>
            </div>
          </Card>
        </div>

        <Card className="order-detail__section-card order-detail__items-card">
          <div className="order-detail__items-header">
            <div className="order-detail__section-heading">
              <TruckOutlined />
              <span>Danh sách sách đã mua</span>
            </div>

            <Text type="secondary" className="order-detail__items-count">
              {totalItems} cuốn sách
            </Text>
          </div>

          {isMobile ? (
            <List
              dataSource={orderItems}
              locale={{
                emptyText: <Empty description="Không có sản phẩm trong đơn hàng" />,
              }}
              renderItem={(item, index) => (
                <List.Item className="order-detail__mobile-list-item">
                  <Card className="order-detail__mobile-item-card">
                    <div className="order-detail__mobile-product">
                      <Avatar
                        shape="square"
                        size={62}
                        src={getBookImageUrl(item.thumbnail)}
                        className="order-detail__mobile-product-image"
                      >
                        <ShoppingOutlined />
                      </Avatar>

                      <div className="order-detail__mobile-product-info">
                        <Text strong className="order-detail__mobile-name">
                          {item.bookName}
                        </Text>

                        <Text type="secondary" className="order-detail__mobile-code">
                          Mã sách: {item.bookId}
                        </Text>

                        <div className="order-detail__mobile-product-bottom">
                          <Text type="secondary">x{item.quantity}</Text>

                          <Text className="order-detail__mobile-item-price">
                            {formatCurrency(item.price)}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="order-detail__mobile-subtotal">
                      <span>Thành tiền</span>
                      <b>{formatCurrency(item.price * item.quantity)}</b>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Table
              rowKey={(record, index) => `${record.bookId}-${index}`}
              columns={columns}
              dataSource={orderItems}
              pagination={false}
              className="order-detail__items-table"
            />
          )}

          <div className="order-detail__payment-summary">
            <div className="order-detail__summary-row">
              <Text type="secondary">Tạm tính</Text>
              <Text>{formatCurrency(itemsSubtotal)}</Text>
            </div>

            <div className="order-detail__summary-row">
              <Text type="secondary">Phí vận chuyển</Text>
              <Text>{formatCurrency(shippingFee)}</Text>
            </div>

            <div className="order-detail__summary-row order-detail__summary-row--total">
              <Text strong>Tổng thanh toán</Text>
              <Text strong>{formatCurrency(order.totalPrice)}</Text>
            </div>
          </div>
        </Card>
      </Card>

      {showMobileStickyActions && (
        <div className="order-detail__mobile-sticky-actions">
          {showCancelButton && (
            <Popconfirm
              title="Hủy đơn hàng"
              description="Bạn có chắc muốn hủy đơn hàng này không?"
              okText="Hủy đơn"
              cancelText="Không"
              okButtonProps={{ danger: true }}
              onConfirm={handleCancelOrder}
            >
              <Button danger block icon={<CloseCircleOutlined />} loading={cancelLoading}>
                Hủy đơn
              </Button>
            </Popconfirm>
          )}

          {showRepayButton && (
            <Button
              type="primary"
              block
              icon={<CreditCardOutlined />}
              loading={payingLoading}
              onClick={handleRepayOrder}
            >
              Thanh toán lại
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
