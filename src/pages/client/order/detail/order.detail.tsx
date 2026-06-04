import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Grid,
  List,
  Popconfirm,
  Space,
  Spin,
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
  ReloadOutlined,
  ShoppingOutlined,
  TruckOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { cancelOrderAPI, getOrderByIdAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './order.detail.scss';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const orderStatusMap = {
  PENDING: {
    text: 'Chờ xác nhận',
    color: 'gold',
  },
  CONFIRMED: {
    text: 'Đã xác nhận',
    color: 'blue',
  },
  SHIPPING: {
    text: 'Đang giao',
    color: 'processing',
  },
  COMPLETED: {
    text: 'Hoàn thành',
    color: 'success',
  },
  CANCELLED: {
    text: 'Đã hủy',
    color: 'error',
  },
};

const paymentMethodMap = {
  COD: 'Thanh toán khi nhận hàng',
  ONLINE: 'VNPay',
};

const paymentStatusMap = {
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

const orderStepIndexMap = {
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

const getOrderItemsCount = (order?: IOrder) => {
  return order?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0;
};

const getReceiverInfo = (order?: IOrder) => {
  const shippingAddress = (order as any)?.shippingAddress;

  return {
    name: shippingAddress?.fullName || '---',
    phone: shippingAddress?.phone || '---',
    address: shippingAddress?.address || '---',
  };
};

const getShippingFee = (order?: IOrder) => {
  const orderData = order as any;

  return orderData?.shippingFee ?? 0;
};

const getOrderStepCurrent = (status?: IOrder['status']) => {
  if (!status || status === 'CANCELLED') return 0;

  return orderStepIndexMap[status as keyof typeof orderStepIndexMap] ?? 0;
};

const getNextStatusText = (status?: IOrder['status']) => {
  switch (status) {
    case 'PENDING':
      return 'Đơn hàng đang chờ admin xác nhận.';
    case 'CONFIRMED':
      return 'Đơn hàng đã được xác nhận và đang chờ giao.';
    case 'SHIPPING':
      return 'Đơn hàng đang được giao đến bạn.';
    case 'COMPLETED':
      return 'Đơn hàng đã hoàn thành.';
    case 'CANCELLED':
      return 'Đơn hàng đã bị hủy.';
    default:
      return '';
  }
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const receiverInfo = useMemo(() => getReceiverInfo(order ?? undefined), [order]);
  const totalItems = useMemo(() => getOrderItemsCount(order ?? undefined), [order]);
  const shippingFee = useMemo(() => getShippingFee(order ?? undefined), [order]);

  const fetchOrderDetail = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const res = await getOrderByIdAPI(id);

      setOrder(res.data ?? null);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể tải chi tiết đơn hàng';

      message.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
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
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể hủy đơn hàng';

      message.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const columns: ColumnsType<IOrder['items'][number]> = [
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
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail">
        <Card className="order-detail__card">
          <Empty description="Không tìm thấy đơn hàng" />
          <div className="order-detail__empty-action">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="order-detail">
      <Card className="order-detail__card">
        <div className="order-detail__header">
          <div>
            <Space className="order-detail__breadcrumb" size={8}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                Quay lại
              </Button>

              {!isMobile && (
                <>
                  <Button onClick={() => navigate('/orders')}>Đơn hàng của tôi</Button>
                  <Button onClick={() => navigate('/orders/history')}>Lịch sử mua hàng</Button>
                </>
              )}
            </Space>

            <div className="order-detail__heading">
              <div className="order-detail__icon">
                <ShoppingOutlined />
              </div>

              <div>
                <Title level={3} className="order-detail__title">
                  Chi tiết đơn hàng
                </Title>

                <Text type="secondary" className="order-detail__subtitle">
                  Mã đơn hàng: {order.orderCode}
                </Text>
              </div>
            </div>
          </div>

          <Space className="order-detail__header-actions">
            <Button icon={<ReloadOutlined />} onClick={fetchOrderDetail} loading={loading}>
              Tải lại
            </Button>

            {order.status === 'PENDING' && (
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

        <div className="order-detail__status-card">
          {isMobile ? (
            <div className="order-detail__mobile-status-box">
              <div className="order-detail__mobile-status-top">
                {order.status === 'CANCELLED' ? (
                  <CloseCircleOutlined className="order-detail__mobile-status-icon order-detail__mobile-status-icon--cancelled" />
                ) : (
                  <CheckCircleOutlined className="order-detail__mobile-status-icon" />
                )}

                <div>
                  <Text strong className="order-detail__mobile-status-title">
                    {orderStatusMap[order.status]?.text}
                  </Text>
                  <Text type="secondary" className="order-detail__mobile-status-desc">
                    {getNextStatusText(order.status)}
                  </Text>
                </div>
              </div>

              {order.status !== 'CANCELLED' && (
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
              )}
            </div>
          ) : order.status === 'CANCELLED' ? (
            <div className="order-detail__cancelled">
              <CloseCircleOutlined />
              <div>
                <Text strong>Đơn hàng đã hủy</Text>
                <Text type="secondary">Đơn hàng này đã được hủy và không tiếp tục xử lý.</Text>
              </div>
            </div>
          ) : (
            <Steps current={getOrderStepCurrent(order.status)} items={orderStepItems} />
          )}
        </div>

        {isMobile ? (
          <div className="order-detail__mobile-info">
            <Card className="order-detail__section-card">
              <div className="order-detail__section-title">
                <ShoppingOutlined />
                <span>Thông tin đơn hàng</span>
              </div>

              <div className="order-detail__info-list">
                <div className="order-detail__info-row">
                  <Text type="secondary">Mã đơn</Text>
                  <Text strong>{order.orderCode}</Text>
                </div>

                <div className="order-detail__info-row">
                  <Text type="secondary">Ngày đặt</Text>
                  <Text>{formatDateTime(order.createdAt)}</Text>
                </div>

                <div className="order-detail__info-row">
                  <Text type="secondary">Trạng thái</Text>
                  <Tag color={orderStatusMap[order.status]?.color}>
                    {orderStatusMap[order.status]?.text}
                  </Tag>
                </div>

                <div className="order-detail__info-row">
                  <Text type="secondary">Sản phẩm</Text>
                  <Text>{totalItems} sản phẩm</Text>
                </div>

                <div className="order-detail__info-row">
                  <Text type="secondary">Tổng tiền</Text>
                  <Text strong className="order-detail__price">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </div>
              </div>
            </Card>

            <Card className="order-detail__section-card">
              <div className="order-detail__section-title">
                <CreditCardOutlined />
                <span>Thanh toán</span>
              </div>

              <div className="order-detail__info-list">
                <div className="order-detail__info-row">
                  <Text type="secondary">Phương thức</Text>
                  <Text>{paymentMethodMap[order.paymentMethod]}</Text>
                </div>

                <div className="order-detail__info-row">
                  <Text type="secondary">Trạng thái</Text>
                  <Tag color={paymentStatusMap[order.paymentStatus]?.color}>
                    {paymentStatusMap[order.paymentStatus]?.text}
                  </Tag>
                </div>
              </div>
            </Card>

            <Card className="order-detail__section-card">
              <div className="order-detail__section-title">
                <UserOutlined />
                <span>Người nhận</span>
              </div>

              <div className="order-detail__info-list">
                <div className="order-detail__info-row">
                  <Text type="secondary">Họ tên</Text>
                  <Text>{receiverInfo.name}</Text>
                </div>

                <div className="order-detail__info-row">
                  <Text type="secondary">Số điện thoại</Text>
                  <Text>{receiverInfo.phone}</Text>
                </div>

                <div className="order-detail__info-row order-detail__info-row--address">
                  <Text type="secondary">Địa chỉ</Text>
                  <Text>{receiverInfo.address}</Text>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="order-detail__grid">
            <Card className="order-detail__section-card">
              <div className="order-detail__section-title">
                <ShoppingOutlined />
                <span>Thông tin đơn hàng</span>
              </div>

              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Mã đơn hàng">
                  <Text strong>{order.orderCode}</Text>
                </Descriptions.Item>

                <Descriptions.Item label="Ngày đặt">
                  {formatDateTime(order.createdAt)}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái đơn">
                  <Tag color={orderStatusMap[order.status]?.color}>
                    {orderStatusMap[order.status]?.text}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Tổng số sản phẩm">
                  {totalItems} sản phẩm
                </Descriptions.Item>

                <Descriptions.Item label="Tổng tiền">
                  <Text strong className="order-detail__price">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Phí vận chuyển">
                  {formatCurrency(shippingFee)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="order-detail__section-card">
              <div className="order-detail__section-title">
                <CreditCardOutlined />
                <span>Thanh toán</span>
              </div>

              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Phương thức">
                  {paymentMethodMap[order.paymentMethod]}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                  <Tag color={paymentStatusMap[order.paymentStatus]?.color}>
                    {paymentStatusMap[order.paymentStatus]?.text}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <div className="order-detail__section-title order-detail__section-title--receiver">
                <UserOutlined />
                <span>Người nhận</span>
              </div>

              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Họ tên">{receiverInfo.name}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{receiverInfo.phone}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{receiverInfo.address}</Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}

        <Card className="order-detail__section-card order-detail__items-card">
          <div className="order-detail__section-title">
            <TruckOutlined />
            <span>Danh sách sách đã mua</span>
          </div>

          {isMobile ? (
            <List
              dataSource={order.items}
              locale={{
                emptyText: <Empty description="Không có sản phẩm trong đơn hàng" />,
              }}
              renderItem={(item) => (
                <Card className="order-detail__mobile-item-card">
                  <div className="order-detail__mobile-product">
                    <Avatar
                      shape="square"
                      size={58}
                      src={getBookImageUrl(item.thumbnail)}
                      className="order-detail__product-image"
                    >
                      <ShoppingOutlined />
                    </Avatar>

                    <div className="order-detail__mobile-product-info">
                      <Text strong className="order-detail__mobile-name">
                        {item.bookName}
                      </Text>

                      <Text type="secondary" className="order-detail__mobile-meta">
                        {formatCurrency(item.price)} x {item.quantity}
                      </Text>

                      <Text strong className="order-detail__price">
                        {formatCurrency(item.price * item.quantity)}
                      </Text>
                    </div>
                  </div>
                </Card>
              )}
            />
          ) : (
            <Table
              rowKey={(record) => record.bookId}
              columns={columns}
              dataSource={order.items}
              pagination={false}
              className="order-detail__items-table"
            />
          )}

          <div className="order-detail__summary">
            <div className="order-detail__summary-row">
              <Text type="secondary">Tạm tính</Text>
              <Text>{formatCurrency(order.totalPrice - shippingFee)}</Text>
            </div>

            <div className="order-detail__summary-row">
              <Text type="secondary">Phí vận chuyển</Text>
              <Text>{formatCurrency(shippingFee)}</Text>
            </div>

            <div className="order-detail__summary-row order-detail__summary-row--total">
              <Text strong>Tổng thanh toán</Text>
              <Text strong className="order-detail__price">
                {formatCurrency(order.totalPrice)}
              </Text>
            </div>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default OrderDetailPage;
