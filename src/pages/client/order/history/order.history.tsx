import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Empty,
  Grid,
  List,
  Pagination,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyHistoryOrdersAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './order.history.scss';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const HISTORY_ORDER_STATUSES: IOrder['status'][] = ['COMPLETED', 'CANCELLED'];

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [2, 3, 5, 10];

const orderStatusMap: Record<IOrder['status'], { text: string; color: string; message: string }> = {
  PENDING: {
    text: 'Chờ xác nhận',
    color: 'gold',
    message: 'Đơn hàng đang chờ xác nhận.',
  },
  CONFIRMED: {
    text: 'Đã xác nhận',
    color: 'blue',
    message: 'Đơn hàng đã được xác nhận.',
  },
  SHIPPING: {
    text: 'Đang giao',
    color: 'processing',
    message: 'Đơn hàng đang được giao đến bạn.',
  },
  COMPLETED: {
    text: 'Hoàn thành',
    color: 'success',
    message: 'Đơn hàng đã hoàn thành. Cảm ơn bạn đã mua sách tại BookStore.',
  },
  CANCELLED: {
    text: 'Đã hủy',
    color: 'error',
    message: 'Đơn hàng đã được hủy và không còn tiếp tục xử lý.',
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

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const pageTopRef = useRef<HTMLDivElement | null>(null);

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalOrders, setTotalOrders] = useState(0);
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
          fromLabel: 'lịch sử mua hàng',
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

  const fetchHistoryOrders = async () => {
    setLoading(true);

    try {
      const res = await getMyHistoryOrdersAPI(currentPage, pageSize);

      if (res.error) {
        throw res;
      }

      const result = res.data?.result ?? [];
      const meta = res.data?.meta;
      const historyOrders = result.filter((order) => HISTORY_ORDER_STATUSES.includes(order.status));
      const total = meta?.total ?? historyOrders.length;
      const totalPages = meta?.pages ?? Math.ceil(total / pageSize);

      if (total > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
        return;
      }

      setOrders(historyOrders);
      setTotalOrders(total);
    } catch (error: any) {
      setOrders([]);
      setTotalOrders(0);
      message.error(getErrorMessage(error, 'Không thể tải lịch sử mua hàng'));
    } finally {
      setLoading(false);
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
    await fetchHistoryOrders();
    scrollToPageTop();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    fetchHistoryOrders();
  }, [currentPage, pageSize]);

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
            <div className="order-history__desktop-order">
              <Text className="order-history__code">{record.orderCode}</Text>

              <div className="order-history__desktop-products">
                {previewItems.map((item, index) => (
                  <div
                    key={`${record._id}-${item.bookId}-${index}`}
                    className="order-history__desktop-product"
                    onClick={() => handleViewBookDetail(item.bookId)}
                    title="Xem chi tiết sản phẩm"
                  >
                    <Avatar
                      shape="square"
                      size={48}
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
                <Text type="secondary">{totalItems} cuốn sách</Text>

                {remainItemsCount > 0 && (
                  <Button
                    type="link"
                    className="order-history__more-btn"
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
          <Text className="order-history__date">{formatDateTime(createdAt)}</Text>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: IOrder['status']) => (
          <Tag className="order-history__tag" color={orderStatusMap[status].color}>
            {orderStatusMap[status].text}
          </Tag>
        ),
      },
      {
        title: 'Thanh toán',
        key: 'payment',
        width: 190,
        render: (_, record) => (
          <div className="order-history__payment">
            <Text className="order-history__payment-method">
              {paymentMethodMap[record.paymentMethod]}
            </Text>

            <Tag
              className="order-history__tag"
              color={paymentStatusMap[record.paymentStatus].color}
            >
              {paymentStatusMap[record.paymentStatus].text}
            </Tag>
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
          <Text strong className="order-history__price">
            {formatCurrency(totalPrice)}
          </Text>
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
    [expandedOrderIds, handleViewBookDetail, navigate, toggleOrderProducts],
  );

  const renderMobileOrderCard = (order: IOrder) => {
    const isExpanded = !!expandedOrderIds[order._id];
    const previewItems = isExpanded ? (order.items ?? []) : getPreviewItems(order, 2);
    const remainItemsCount = getRemainItemsCount(order, 2);
    const totalItems = getOrderItemsCount(order);
    const statusInfo = orderStatusMap[order.status];
    const paymentInfo = paymentStatusMap[order.paymentStatus];
    const StatusIcon = order.status === 'COMPLETED' ? CheckCircleOutlined : CloseCircleOutlined;

    return (
      <List.Item className="order-history__mobile-list-item">
        <Card className="order-history__mobile-card">
          <div className="order-history__mobile-top">
            <div className="order-history__mobile-code-box">
              <Text className="order-history__mobile-code">{order.orderCode}</Text>
              <Text className="order-history__mobile-date">{formatDateTime(order.createdAt)}</Text>
            </div>

            <Tag className="order-history__mobile-status" color={statusInfo.color}>
              {statusInfo.text}
            </Tag>
          </div>

          <div
            className={`order-history__mobile-message order-history__mobile-message--${order.status.toLowerCase()}`}
          >
            <StatusIcon />
            <span>{statusInfo.message}</span>
          </div>

          <div className="order-history__mobile-products">
            {previewItems.map((item, index) => (
              <div
                key={`${order._id}-${item.bookId}-${index}`}
                className="order-history__mobile-product"
                onClick={() => handleViewBookDetail(item.bookId)}
                title="Xem chi tiết sản phẩm"
              >
                <Avatar
                  shape="square"
                  size={58}
                  src={getBookImageUrl(item.thumbnail)}
                  className="order-history__mobile-image"
                >
                  <ShoppingOutlined />
                </Avatar>

                <div className="order-history__mobile-product-info">
                  <Text className="order-history__mobile-name">{item.bookName}</Text>

                  <div className="order-history__mobile-product-bottom">
                    <Text type="secondary" className="order-history__mobile-qty">
                      x{item.quantity}
                    </Text>

                    <Text className="order-history__mobile-item-price">
                      {formatCurrency(item.price)}
                    </Text>
                  </div>
                </div>
              </div>
            ))}

            {remainItemsCount > 0 && (
              <button
                type="button"
                className="order-history__mobile-more"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleOrderProducts(order._id);
                }}
              >
                {isExpanded ? 'Thu gọn' : `Xem thêm ${remainItemsCount} sản phẩm`}
              </button>
            )}
          </div>

          <div className="order-history__mobile-info-box">
            <div className="order-history__mobile-info-row">
              <span>Phương thức</span>
              <b>{paymentMethodMap[order.paymentMethod]}</b>
            </div>

            <div className="order-history__mobile-info-row">
              <span>Thanh toán</span>
              <Tag className="order-history__payment-tag" color={paymentInfo.color}>
                {paymentInfo.text}
              </Tag>
            </div>
          </div>

          <div className="order-history__mobile-total">
            <span>Tổng số tiền ({totalItems} cuốn sách)</span>
            <b>{formatCurrency(order.totalPrice)}</b>
          </div>

          <div className="order-history__mobile-actions">
            <Button block icon={<EyeOutlined />} onClick={() => navigate(`/orders/${order._id}`)}>
              Xem chi tiết
            </Button>
          </div>
        </Card>
      </List.Item>
    );
  };

  return (
    <div className="order-history" ref={pageTopRef}>
      <Card className="order-history__card">
        <div className="order-history__header">
          <div className="order-history__heading">
            <div className="order-history__icon">
              <HistoryOutlined />
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

          <div className="order-history__header-actions">
            <Button onClick={() => navigate('/orders')}>Đơn đang xử lý</Button>

            <Button icon={<ReloadOutlined />} onClick={handleReload} loading={loading}>
              Tải lại
            </Button>
          </div>
        </div>

        <div className="order-history__toolbar">
          <div className="order-history__toolbar-left">
            <span>Tổng {totalOrders} đơn hàng</span>
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
            <Button className="order-history__page-size-btn">
              Hiển thị {pageSize} đơn / trang
              <DownOutlined />
            </Button>
          </Dropdown>
        </div>

        {isMobile ? (
          <>
            <List
              dataSource={orders}
              loading={loading}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Bạn chưa có lịch sử mua hàng."
                  />
                ),
              }}
              renderItem={renderMobileOrderCard}
            />

            {totalOrders > pageSize && (
              <div className="order-history__pagination">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalOrders}
                  size="small"
                  showSizeChanger={false}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={orders}
            loading={loading}
            pagination={
              totalOrders > pageSize
                ? {
                    current: currentPage,
                    pageSize,
                    total: totalOrders,
                    showSizeChanger: false,
                    onChange: handlePageChange,
                  }
                : false
            }
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Bạn chưa có lịch sử mua hàng."
                />
              ),
            }}
            scroll={{ x: 1080 }}
            className="order-history__table"
          />
        )}
      </Card>
    </div>
  );
};

export default OrderHistoryPage;
