import { getOrderByIdAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import {
  App,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Image,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';

const { Text, Title } = Typography;

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
  ONLINE: 'Thanh toán online',
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

const DetailOrder = ({ open, orderId, refreshKey, onClose }: IProps) => {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [open, orderId, refreshKey, notification]);

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
            <div>
              <Text strong>Đơn hàng đã được tạo</Text>
              <br />
              <Text type="secondary">{formatDateTime(order.createdAt)}</Text>
            </div>
          ),
        },
        {
          color: 'red',
          children: (
            <div>
              <Text strong>Đơn hàng đã bị hủy</Text>
              <br />
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
          <div>
            <Text strong={isCurrent} type={isReached ? undefined : 'secondary'}>
              {orderStatusMap[status].text}
            </Text>

            {status === 'PENDING' && (
              <>
                <br />
                <Text type="secondary">{formatDateTime(order.createdAt)}</Text>
              </>
            )}

            {isCurrent && status !== 'PENDING' && (
              <>
                <br />
                <Text type="secondary">Trạng thái hiện tại</Text>
              </>
            )}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 220,
          }}
        >
          <Image
            width={52}
            height={68}
            src={getBookImageUrl(item.thumbnail)}
            fallback="https://placehold.co/52x68?text=Book"
            style={{
              objectFit: 'cover',
              borderRadius: 6,
            }}
          />

          <Text strong>{item.bookName}</Text>
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
    },
    {
      title: 'Thành tiền',
      key: 'total',
      width: 150,
      align: 'right',
      render: (_, item) => <Text strong>{formatCurrency(item.price * item.quantity)}</Text>,
    },
  ];

  return (
    <Drawer
      title={order ? `Chi tiết đơn hàng ${order.orderCode}` : 'Chi tiết đơn hàng'}
      open={open}
      width={900}
      onClose={onClose}
    >
      <Spin spinning={isLoading}>
        {!order ? (
          <Empty description="Không có thông tin đơn hàng" />
        ) : (
          <>
            <Descriptions
              bordered
              column={{
                xs: 1,
                sm: 1,
                md: 2,
              }}
            >
              <Descriptions.Item label="Mã đơn hàng">
                <Text strong copyable>
                  {order.orderCode}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo">
                {formatDateTime(order.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Khách hàng">{customerInfo.fullName}</Descriptions.Item>

              <Descriptions.Item label="Email">{customerInfo.email}</Descriptions.Item>

              <Descriptions.Item label="Trạng thái đơn hàng">
                <Tag color={orderStatusMap[order.status].color}>
                  {orderStatusMap[order.status].text}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={paymentStatusMap[order.paymentStatus].color}>
                  {paymentStatusMap[order.paymentStatus].text}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Phương thức thanh toán" span={2}>
                {paymentMethodMap[order.paymentMethod]}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Địa chỉ nhận hàng</Title>

            <Descriptions bordered column={1}>
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

            <Divider />

            <Title level={5}>Danh sách sản phẩm</Title>

            <Table<IOrderItem>
              rowKey={(item) => item.bookId}
              columns={itemColumns}
              dataSource={order.items}
              pagination={false}
              scroll={{ x: 700 }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 20,
              }}
            >
              <div
                style={{
                  minWidth: 300,
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text strong>Tổng tiền đơn hàng:</Text>

                  <Text
                    strong
                    style={{
                      fontSize: 18,
                      color: '#cf1322',
                    }}
                  >
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            <Title level={5}>Tiến trình đơn hàng</Title>

            <Timeline items={timelineItems} />
          </>
        )}
      </Spin>
    </Drawer>
  );
};

export default DetailOrder;
