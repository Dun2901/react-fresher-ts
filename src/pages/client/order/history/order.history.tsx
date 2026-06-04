import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Grid,
  List,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMyHistoryOrdersAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './order.history.scss';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const HISTORY_ORDER_STATUSES = ['COMPLETED', 'CANCELLED'];

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
  COD: 'COD',
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

const formatDateTime = (date?: string) => {
  if (!date) return '';

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

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistoryOrders = async () => {
    setLoading(true);

    try {
      const res = await getMyHistoryOrdersAPI(1, 10);
      const allOrders = res.data?.result ?? [];

      const historyOrders = allOrders.filter((order: IOrder) =>
        HISTORY_ORDER_STATUSES.includes(order.status),
      );

      setOrders(historyOrders);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể tải lịch sử mua hàng';

      message.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryOrders();
  }, []);

  const columns: ColumnsType<IOrder> = useMemo(
    () => [
      {
        title: 'Đơn hàng',
        key: 'product',
        width: 360,
        render: (_, record) => {
          const previewItems = getPreviewItems(record, 2);
          const remainItemsCount = getRemainItemsCount(record, 2);
          const totalItems = getOrderItemsCount(record);

          return (
            <div className="order-history__desktop-order">
              <Text type="secondary" className="order-history__code">
                {record.orderCode}
              </Text>

              <div className="order-history__desktop-products">
                {previewItems.map((item, index) => (
                  <div
                    key={`${record._id}-${item.bookId}-${index}`}
                    className="order-history__desktop-product"
                  >
                    <Avatar
                      shape="square"
                      size={46}
                      src={getBookImageUrl(item.thumbnail)}
                      className="order-history__product-image"
                    >
                      <ShoppingOutlined />
                    </Avatar>

                    <div className="order-history__product-info">
                      <Text className="order-history__product-name">{item.bookName}</Text>

                      <Text type="secondary" className="order-history__product-meta">
                        x{item.quantity} • {formatCurrency(item.price)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-history__desktop-meta">
                <Text type="secondary">{totalItems} sản phẩm</Text>

                {remainItemsCount > 0 && (
                  <Button
                    type="link"
                    className="order-history__more-btn"
                    onClick={() => navigate(`/orders/${record._id}`)}
                  >
                    Xem thêm {remainItemsCount} sản phẩm
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
        width: 150,
        render: (createdAt: string) => (
          <Text className="order-history__date">{formatDateTime(createdAt)}</Text>
        ),
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        width: 140,
        align: 'right',
        render: (totalPrice: number) => (
          <Text strong className="order-history__price">
            {formatCurrency(totalPrice)}
          </Text>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (status: keyof typeof orderStatusMap) => (
          <Tag className="order-history__tag" color={orderStatusMap[status]?.color}>
            {orderStatusMap[status]?.text}
          </Tag>
        ),
      },
      {
        title: 'Thanh toán',
        key: 'payment',
        width: 180,
        render: (_, record) => (
          <div className="order-history__payment">
            <Text>{paymentMethodMap[record.paymentMethod]}</Text>

            <Tag
              className="order-history__tag"
              color={paymentStatusMap[record.paymentStatus]?.color}
            >
              {paymentStatusMap[record.paymentStatus]?.text}
            </Tag>
          </div>
        ),
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 120,
        align: 'right',
        render: (_, record) => (
          <Button icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record._id}`)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="order-history">
      <Card className="order-history__card">
        <div className="order-history__header">
          <div className="order-history__heading">
            <div className="order-history__icon">
              <CheckCircleOutlined />
            </div>

            <div>
              <Title level={3} className="order-history__title">
                Lịch sử mua hàng
              </Title>

              <Text type="secondary" className="order-history__subtitle">
                Xem lại các đơn hàng đã hoàn thành hoặc đã hủy.
              </Text>
            </div>
          </div>

          <Button icon={<ReloadOutlined />} onClick={fetchHistoryOrders} loading={loading}>
            Tải lại
          </Button>
        </div>

        {isMobile ? (
          <List
            dataSource={orders}
            loading={loading}
            pagination={{
              pageSize: 4,
              size: 'small',
              align: 'center',
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có lịch sử mua hàng."
                />
              ),
            }}
            renderItem={(order) => {
              const previewItems = getPreviewItems(order, 2);
              const remainItemsCount = getRemainItemsCount(order, 2);
              const totalItems = getOrderItemsCount(order);

              return (
                <Card className="order-history__mobile-card">
                  <div className="order-history__mobile-top">
                    <div>
                      <Text type="secondary" className="order-history__mobile-code">
                        {order.orderCode}
                      </Text>

                      <Text type="secondary" className="order-history__mobile-date">
                        {formatDateTime(order.createdAt)}
                      </Text>
                    </div>

                    <Tag
                      className="order-history__tag order-history__mobile-status"
                      color={orderStatusMap[order.status]?.color}
                    >
                      {orderStatusMap[order.status]?.text}
                    </Tag>
                  </div>

                  <div className="order-history__mobile-products">
                    {previewItems.map((item, index) => (
                      <div
                        key={`${order._id}-${item.bookId}-${index}`}
                        className="order-history__mobile-product"
                      >
                        <Avatar
                          shape="square"
                          size={52}
                          src={getBookImageUrl(item.thumbnail)}
                          className="order-history__mobile-image"
                        >
                          <ShoppingOutlined />
                        </Avatar>

                        <div className="order-history__mobile-product-info">
                          <Text className="order-history__mobile-name">{item.bookName}</Text>

                          <Text type="secondary" className="order-history__mobile-product-meta">
                            x{item.quantity}
                          </Text>
                        </div>

                        <Text className="order-history__mobile-item-price">
                          {formatCurrency(item.price)}
                        </Text>
                      </div>
                    ))}

                    {remainItemsCount > 0 && (
                      <Button
                        type="link"
                        className="order-history__mobile-more"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        Xem thêm {remainItemsCount} sản phẩm
                      </Button>
                    )}
                  </div>

                  <div className="order-history__mobile-footer">
                    <Text type="secondary">Tổng số tiền ({totalItems} sản phẩm)</Text>

                    <Text strong className="order-history__price">
                      {formatCurrency(order.totalPrice)}
                    </Text>
                  </div>

                  <div className="order-history__mobile-payment-row">
                    <Text type="secondary">{paymentMethodMap[order.paymentMethod]}</Text>

                    <Tag
                      className="order-history__tag"
                      color={paymentStatusMap[order.paymentStatus]?.color}
                    >
                      {paymentStatusMap[order.paymentStatus]?.text}
                    </Tag>
                  </div>

                  <div className="order-history__mobile-actions">
                    <Button
                      size="middle"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      Chi tiết
                    </Button>

                    {order.status === 'COMPLETED' ? (
                      <Button size="middle" icon={<CheckCircleOutlined />} disabled>
                        Đã mua
                      </Button>
                    ) : (
                      <Button size="middle" icon={<CloseCircleOutlined />} disabled danger>
                        Đã hủy
                      </Button>
                    )}
                  </div>
                </Card>
              );
            }}
          />
        ) : (
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={orders}
            loading={loading}
            pagination={{
              pageSize: 6,
              showSizeChanger: false,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có lịch sử mua hàng."
                />
              ),
            }}
            className="order-history__table"
          />
        )}
      </Card>
    </div>
  );
};

export default OrderHistoryPage;
