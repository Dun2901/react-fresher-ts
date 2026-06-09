import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { getOrderByIdAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import {
  App,
  Avatar,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Grid,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import './detail.order.scss';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

type OrderStatus = IOrder['status'];
type PaymentStatus = IOrder['paymentStatus'];
type PaymentMethod = IOrder['paymentMethod'];

interface IProps {
  open: boolean;
  orderId: string | null;
  refreshKey: number;
  onClose: () => void;
}

const orderStatusMap: Record<
  OrderStatus,
  {
    text: string;
    color: string;
  }
> = {
  PENDING: {
    text: 'Chờ xác nhận',
    color: 'gold',
  },
  CONFIRMED: {
    text: 'Đã xác nhận',
    color: 'blue',
  },
  SHIPPING: {
    text: 'Đang giao hàng',
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

const paymentStatusMap: Record<
  PaymentStatus,
  {
    text: string;
    color: string;
  }
> = {
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
    color: 'purple',
  },
};

const paymentMethodMap: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  ONLINE: 'VNPay',
};

const statusFlow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED'];

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

const getErrorDescription = (error: any, fallback: string) => {
  const responseMessage =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.error?.message ||
    error?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage[0] || fallback;
  }

  return responseMessage || fallback;
};

const getTotalBooks = (order: IOrder) => {
  return order.items?.reduce((total, item) => total + item.quantity, 0) || 0;
};

const DetailOrder = ({ open, orderId, refreshKey, onClose }: IProps) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [order, setOrder] = useState<IOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { notification } = App.useApp();

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!open || !orderId) return;

      setIsLoading(true);

      try {
        const res = await getOrderByIdAPI(orderId);

        if (res.data) {
          setOrder(res.data);
          return;
        }

        notification.error({
          message: 'Không thể lấy chi tiết đơn hàng',
          description: Array.isArray(res.error?.message)
            ? res.error.message[0]
            : res.error?.message || 'Có lỗi xảy ra.',
        });
      } catch (error: any) {
        notification.error({
          message: 'Không thể lấy chi tiết đơn hàng',
          description: getErrorDescription(error, 'Đã xảy ra lỗi khi tải chi tiết đơn hàng.'),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [open, orderId, refreshKey, notification]);

  useEffect(() => {
    if (!open) {
      setOrder(null);
    }
  }, [open]);

  const customerInfo = useMemo(() => {
    if (!order) {
      return {
        fullName: '---',
        email: '---',
      };
    }

    if (typeof order.userId === 'object') {
      return {
        fullName: order.userId.fullName || '---',
        email: order.userId.email || '---',
      };
    }

    return {
      fullName: order.shippingAddress?.fullName || '---',
      email: '---',
    };
  }, [order]);

  const timelineItems = useMemo(() => {
    if (!order) return [];

    if (order.status === 'CANCELLED') {
      return [
        {
          color: 'blue',
          children: (
            <div className="admin-order-detail__timeline-item">
              <Text strong>Đơn hàng đã được tạo</Text>
              <Text type="secondary">{formatDateTime(order.createdAt)}</Text>
            </div>
          ),
        },
        {
          color: 'red',
          children: (
            <div className="admin-order-detail__timeline-item">
              <Text strong>Đơn hàng đã bị hủy</Text>
              <Text type="secondary">{formatDateTime(order.updatedAt)}</Text>
            </div>
          ),
        },
      ];
    }

    const currentStatusIndex = statusFlow.indexOf(order.status);

    return statusFlow.map((status, index) => {
      const isReached = index <= currentStatusIndex;
      const isCurrent = index === currentStatusIndex;

      return {
        color: isReached ? 'green' : 'gray',
        children: (
          <div className="admin-order-detail__timeline-item">
            <Text strong={isCurrent} type={isReached ? undefined : 'secondary'}>
              {orderStatusMap[status].text}
            </Text>

            {status === 'PENDING' && (
              <Text type="secondary">{formatDateTime(order.createdAt)}</Text>
            )}

            {isCurrent && status !== 'PENDING' && <Text type="secondary">Trạng thái hiện tại</Text>}
          </div>
        ),
      };
    });
  }, [order]);

  const itemColumns: ColumnsType<IOrderItem> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'bookName',
      key: 'bookName',
      render: (_, item) => (
        <div className="admin-order-detail__product">
          <Avatar
            shape="square"
            size={56}
            src={getBookImageUrl(item.thumbnail)}
            className="admin-order-detail__product-image"
          >
            <ShoppingOutlined />
          </Avatar>

          <div className="admin-order-detail__product-info">
            <Text strong className="admin-order-detail__product-name">
              {item.bookName}
            </Text>

            <Text type="secondary" className="admin-order-detail__product-id">
              Mã sách: {item.bookId}
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
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (quantity: number) => `x${quantity}`,
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: 150,
      align: 'right',
      render: (_, item) => (
        <Text strong className="admin-order-detail__price">
          {formatCurrency(item.price * item.quantity)}
        </Text>
      ),
    },
  ];

  const totalBooks = order ? getTotalBooks(order) : 0;

  return (
    <Drawer
      title={order ? `Chi tiết đơn hàng ${order.orderCode}` : 'Chi tiết đơn hàng'}
      open={open}
      width={isMobile ? '100%' : 920}
      onClose={onClose}
      className="admin-order-detail"
      destroyOnClose
    >
      <Spin spinning={isLoading}>
        {!order ? (
          <Empty description="Không có thông tin đơn hàng" />
        ) : (
          <div className="admin-order-detail__content">
            <div className="admin-order-detail__summary-grid">
              <Card className="admin-order-detail__summary-card">
                <div className="admin-order-detail__summary-icon admin-order-detail__summary-icon--order">
                  <ShoppingOutlined />
                </div>

                <div>
                  <Text type="secondary">Mã đơn hàng</Text>
                  <Text strong copyable className="admin-order-detail__summary-value">
                    {order.orderCode}
                  </Text>
                </div>
              </Card>

              <Card className="admin-order-detail__summary-card">
                <div className="admin-order-detail__summary-icon admin-order-detail__summary-icon--status">
                  {order.status === 'CANCELLED' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                </div>

                <div>
                  <Text type="secondary">Trạng thái</Text>
                  <Tag
                    color={orderStatusMap[order.status].color}
                    className="admin-order-detail__tag"
                  >
                    {orderStatusMap[order.status].text}
                  </Tag>
                </div>
              </Card>

              <Card className="admin-order-detail__summary-card">
                <div className="admin-order-detail__summary-icon admin-order-detail__summary-icon--money">
                  <CreditCardOutlined />
                </div>

                <div>
                  <Text type="secondary">Tổng thanh toán</Text>
                  <Text strong className="admin-order-detail__summary-price">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </div>
              </Card>
            </div>

            <Card className="admin-order-detail__section-card">
              <Title level={5} className="admin-order-detail__section-title">
                Thông tin đơn hàng
              </Title>

              <Descriptions
                bordered
                size="small"
                column={{
                  xs: 1,
                  sm: 1,
                  md: 2,
                }}
              >
                <Descriptions.Item label="Ngày tạo">
                  {formatDateTime(order.createdAt)}
                </Descriptions.Item>

                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatDateTime(order.updatedAt)}
                </Descriptions.Item>

                <Descriptions.Item label="Khách hàng">{customerInfo.fullName}</Descriptions.Item>

                <Descriptions.Item label="Email">{customerInfo.email}</Descriptions.Item>

                <Descriptions.Item label="Phương thức thanh toán">
                  {paymentMethodMap[order.paymentMethod]}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái thanh toán">
                  <Tag color={paymentStatusMap[order.paymentStatus].color}>
                    {paymentStatusMap[order.paymentStatus].text}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="admin-order-detail__section-card">
              <Title level={5} className="admin-order-detail__section-title">
                <EnvironmentOutlined /> Địa chỉ nhận hàng
              </Title>

              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Người nhận">
                  {order.shippingAddress?.fullName || '---'}
                </Descriptions.Item>

                <Descriptions.Item label="Số điện thoại">
                  {order.shippingAddress?.phone || '---'}
                </Descriptions.Item>

                <Descriptions.Item label="Địa chỉ">
                  {order.shippingAddress?.address || '---'}
                </Descriptions.Item>

                <Descriptions.Item label="Ghi chú">
                  {order.note || 'Không có ghi chú'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="admin-order-detail__section-card">
              <div className="admin-order-detail__section-heading">
                <Title level={5} className="admin-order-detail__section-title">
                  Danh sách sản phẩm
                </Title>

                <Text type="secondary">{totalBooks} cuốn sách</Text>
              </div>

              <Table<IOrderItem>
                rowKey={(item, index) => `${item.bookId}-${index}`}
                columns={itemColumns}
                dataSource={order.items}
                pagination={false}
                scroll={{ x: 760 }}
                className="admin-order-detail__product-table"
              />

              <div className="admin-order-detail__total-box">
                <div className="admin-order-detail__total-row">
                  <Text strong>Tổng tiền đơn hàng</Text>

                  <Text strong className="admin-order-detail__total-price">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </div>
              </div>
            </Card>

            <Card className="admin-order-detail__section-card">
              <Title level={5} className="admin-order-detail__section-title">
                <UserOutlined /> Tiến trình đơn hàng
              </Title>

              <Timeline items={timelineItems} />
            </Card>
          </div>
        )}
      </Spin>
    </Drawer>
  );
};

export default DetailOrder;
