import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  OrderedListOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  getDashboardSummaryAPI,
  getLatestOrdersDashboardAPI,
  getTopSellingBooksDashboardAPI,
} from '@/services/api';
import { formatCurrency } from '@/services/helper';
import './dashboard.scss';

type OrderStatus = IOrder['status'];
type PaymentStatus = IOrder['paymentStatus'];

const { Title, Text } = Typography;

const orderStatusMap: Record<OrderStatus, { text: string; color: string }> = {
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

const paymentStatusMap: Record<PaymentStatus, { text: string; color: string }> = {
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

const DashBoardPage = () => {
  const [summary, setSummary] = useState<IDashboardSummary | null>(null);
  const [latestOrders, setLatestOrders] = useState<IDashboardLatestOrder[]>([]);
  const [topSellingBooks, setTopSellingBooks] = useState<IDashboardTopSellingBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [summaryRes, latestOrdersRes, topSellingBooksRes] = await Promise.all([
        getDashboardSummaryAPI(),
        getLatestOrdersDashboardAPI(6),
        getTopSellingBooksDashboardAPI(6),
      ]);

      setSummary(summaryRes.data || null);
      setLatestOrders(latestOrdersRes.data || []);
      setTopSellingBooks(topSellingBooksRes.data || []);
    } catch {
      setErrorMessage('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const latestOrderColumns: ColumnsType<IDashboardLatestOrder> = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 210,
      render: (orderCode: string) => (
        <span className="admin-dashboard__order-code">{orderCode}</span>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 230,
      render: (_, record) => (
        <div className="admin-dashboard__customer">
          <span className="admin-dashboard__customer-name">
            {record.customerName || 'Không rõ'}
          </span>

          {record.customerEmail && (
            <span className="admin-dashboard__customer-email">{record.customerEmail}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 150,
      align: 'right',
      render: (value: number) => (
        <span className="admin-dashboard__price">{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      align: 'center',
      render: (status: OrderStatus) => (
        <Tag color={orderStatusMap[status]?.color}>{orderStatusMap[status]?.text || status}</Tag>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 160,
      align: 'center',
      render: (paymentStatus: PaymentStatus) => (
        <Tag color={paymentStatusMap[paymentStatus]?.color}>
          {paymentStatusMap[paymentStatus]?.text || paymentStatus}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (createdAt: string) => dayjs(createdAt).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const topBookColumns: ColumnsType<IDashboardTopSellingBook> = [
    {
      title: 'Tên sách',
      dataIndex: 'mainText',
      key: 'mainText',
      render: (mainText: string, record) => (
        <div>
          <div className="admin-dashboard__book-name">{mainText}</div>

          {record.author && <div className="admin-dashboard__book-author">{record.author}</div>}
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      align: 'right',
      render: (price: number) => (
        <span className="admin-dashboard__book-price">{formatCurrency(price)}</span>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'sold',
      key: 'sold',
      width: 120,
      align: 'center',
      render: (sold: number) => <Tag color="blue">{sold}</Tag>,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (quantity: number) => <Tag color={quantity > 0 ? 'green' : 'red'}>{quantity}</Tag>,
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <Title level={3} className="admin-dashboard__title">
            Dashboard
          </Title>
          <Text className="admin-dashboard__subtitle">
            Tổng quan doanh thu, đơn hàng, sách và người dùng.
          </Text>
        </div>

        <div className="admin-dashboard__actions">
          <Button>
            <Link to="/admin/user">Quản lý user</Link>
          </Button>

          <Button>
            <Link to="/admin/book">Quản lý sách</Link>
          </Button>

          <Button type="primary">
            <Link to="/admin/order">Quản lý đơn hàng</Link>
          </Button>
        </div>
      </div>

      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            action={
              <Button size="small" danger onClick={fetchDashboardData}>
                Thử lại
              </Button>
            }
          />
        )}

        <Skeleton loading={loading && !summary} active paragraph={{ rows: 4 }}>
          <Row gutter={[16, 16]} className="admin-dashboard__stats">
            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Tổng người dùng"
                  value={summary?.totalUsers || 0}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Tổng sách"
                  value={summary?.totalBooks || 0}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Tổng đơn hàng"
                  value={summary?.totalOrders || 0}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Tổng doanh thu"
                  value={summary?.totalRevenue || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                  prefix={<DollarCircleOutlined />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Đơn chờ xác nhận"
                  value={summary?.pendingOrders || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Đơn đã thanh toán"
                  value={summary?.paidOrders || 0}
                  prefix={<DollarCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Đơn hoàn thành"
                  value={summary?.completedOrders || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} xl={6}>
              <Card className="admin-dashboard__stat-card">
                <Statistic
                  title="Đơn đã hủy"
                  value={summary?.cancelledOrders || 0}
                  prefix={<OrderedListOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
        </Skeleton>

        <Card
          className="admin-dashboard__section-card"
          title="Đơn hàng mới nhất"
          extra={<Link to="/admin/order">Xem tất cả</Link>}
        >
          <Table<IDashboardLatestOrder>
            className="admin-dashboard__table"
            rowKey="_id"
            loading={loading}
            columns={latestOrderColumns}
            dataSource={latestOrders}
            pagination={false}
            scroll={{ x: 1070 }}
            locale={{
              emptyText: (
                <div className="admin-dashboard__empty">
                  <Empty description="Chưa có đơn hàng mới" />
                </div>
              ),
            }}
          />
        </Card>

        <Card
          className="admin-dashboard__section-card"
          title="Sách bán chạy"
          extra={<Link to="/admin/book">Xem tất cả</Link>}
        >
          <Table<IDashboardTopSellingBook>
            className="admin-dashboard__table"
            rowKey="_id"
            loading={loading}
            columns={topBookColumns}
            dataSource={topSellingBooks}
            pagination={false}
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <div className="admin-dashboard__empty">
                  <Empty description="Chưa có sách bán chạy" />
                </div>
              ),
            }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default DashBoardPage;
