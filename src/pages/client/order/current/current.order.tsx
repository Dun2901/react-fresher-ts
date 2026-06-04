import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Empty,
  Grid,
  List,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { cancelOrderAPI, getMyOrdersAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './current.order.scss';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const CURRENT_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING'];

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

const CurrentOrderPage = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState('');

  const fetchCurrentOrders = async () => {
    setLoading(true);

    try {
      const res = await getMyOrdersAPI(1, 100);
      const allOrders = res.data?.result ?? [];

      const currentOrders = allOrders.filter((order: IOrder) =>
        CURRENT_ORDER_STATUSES.includes(order.status),
      );

      setOrders(currentOrders);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể tải danh sách đơn hàng';

      message.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
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
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể hủy đơn hàng';

      message.error(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setCancelLoadingId('');
    }
  };

  useEffect(() => {
    fetchCurrentOrders();
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
            <div className="current-order__desktop-order">
              <Text type="secondary" className="current-order__code">
                {record.orderCode}
              </Text>

              <div className="current-order__desktop-products">
                {previewItems.map((item) => (
                  <div key={item.bookId} className="current-order__desktop-product">
                    <Avatar
                      shape="square"
                      size={46}
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
                <Text type="secondary">{totalItems} sản phẩm</Text>

                {remainItemsCount > 0 && (
                  <Button
                    type="link"
                    className="current-order__more-btn"
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
          <Text className="current-order__date">{formatDateTime(createdAt)}</Text>
        ),
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        width: 140,
        align: 'right',
        render: (totalPrice: number) => (
          <Text strong className="current-order__price">
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
          <Tag className="current-order__tag" color={orderStatusMap[status]?.color}>
            {orderStatusMap[status]?.text}
          </Tag>
        ),
      },
      {
        title: 'Thanh toán',
        key: 'payment',
        width: 180,
        render: (_, record) => (
          <div className="current-order__payment">
            <Text>{paymentMethodMap[record.paymentMethod]}</Text>

            <Tag
              className="current-order__tag"
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
        width: 190,
        align: 'right',
        render: (_, record) => (
          <Space size={8} className="current-order__actions">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record._id}`)}>
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
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={cancelLoadingId === record._id}
                >
                  Hủy
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [cancelLoadingId, navigate],
  );

  return (
    <div className="current-order">
      <Card className="current-order__card">
        <div className="current-order__header">
          <div className="current-order__heading">
            <div className="current-order__icon">
              <ShoppingOutlined />
            </div>

            <div>
              <Title level={3} className="current-order__title">
                Đơn hàng của tôi
              </Title>

              <Text type="secondary" className="current-order__subtitle">
                Theo dõi các đơn đang chờ xác nhận, đã xác nhận hoặc đang giao.
              </Text>
            </div>
          </div>

          <Button icon={<ReloadOutlined />} onClick={fetchCurrentOrders} loading={loading}>
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
                  description="Bạn chưa có đơn hàng nào đang xử lý."
                />
              ),
            }}
            renderItem={(order) => {
              const previewItems = getPreviewItems(order, 2);
              const remainItemsCount = getRemainItemsCount(order, 2);
              const totalItems = getOrderItemsCount(order);

              return (
                <Card className="current-order__mobile-card">
                  <div className="current-order__mobile-top">
                    <div>
                      <Text type="secondary" className="current-order__mobile-code">
                        {order.orderCode}
                      </Text>

                      <Text type="secondary" className="current-order__mobile-date">
                        {formatDateTime(order.createdAt)}
                      </Text>
                    </div>

                    <Tag
                      className="current-order__tag current-order__mobile-status"
                      color={orderStatusMap[order.status]?.color}
                    >
                      {orderStatusMap[order.status]?.text}
                    </Tag>
                  </div>

                  <div className="current-order__mobile-products">
                    {previewItems.map((item) => (
                      <div key={item.bookId} className="current-order__mobile-product">
                        <Avatar
                          shape="square"
                          size={52}
                          src={getBookImageUrl(item.thumbnail)}
                          className="current-order__mobile-image"
                        >
                          <ShoppingOutlined />
                        </Avatar>

                        <div className="current-order__mobile-product-info">
                          <Text className="current-order__mobile-name">{item.bookName}</Text>

                          <Text type="secondary" className="current-order__mobile-product-meta">
                            x{item.quantity}
                          </Text>
                        </div>

                        <Text className="current-order__mobile-item-price">
                          {formatCurrency(item.price)}
                        </Text>
                      </div>
                    ))}

                    {remainItemsCount > 0 && (
                      <Button
                        type="link"
                        className="current-order__mobile-more"
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        Xem thêm {remainItemsCount} sản phẩm
                      </Button>
                    )}
                  </div>

                  <div className="current-order__mobile-footer">
                    <Text type="secondary">Tổng số tiền ({totalItems} sản phẩm)</Text>

                    <Text strong className="current-order__price">
                      {formatCurrency(order.totalPrice)}
                    </Text>
                  </div>

                  <div className="current-order__mobile-payment-row">
                    <Text type="secondary">{paymentMethodMap[order.paymentMethod]}</Text>

                    <Tag
                      className="current-order__tag"
                      color={paymentStatusMap[order.paymentStatus]?.color}
                    >
                      {paymentStatusMap[order.paymentStatus]?.text}
                    </Tag>
                  </div>

                  <div className="current-order__mobile-actions">
                    <Button
                      size="middle"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      Chi tiết
                    </Button>

                    {order.status === 'PENDING' && (
                      <Popconfirm
                        title="Hủy đơn hàng"
                        description="Bạn có chắc muốn hủy đơn hàng này không?"
                        okText="Hủy đơn"
                        cancelText="Không"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleCancelOrder(order._id)}
                      >
                        <Button
                          danger
                          size="middle"
                          icon={<CloseCircleOutlined />}
                          loading={cancelLoadingId === order._id}
                        >
                          Hủy
                        </Button>
                      </Popconfirm>
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
                  description="Bạn chưa có đơn hàng nào đang xử lý."
                />
              ),
            }}
            className="current-order__table"
          />
        )}
      </Card>
    </div>
  );
};

export default CurrentOrderPage;
