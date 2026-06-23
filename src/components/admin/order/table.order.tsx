import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  EyeOutlined,
  SendOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns, ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Dropdown, Grid, Popconfirm, Tag, Tooltip, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAllOrdersAPI, updateOrderStatusAPI } from '@/services/api';
import { dateRangeValidate, formatCurrency } from '@/services/helper';
import DetailOrder from './detail.order';
import './table.order.scss';

type OrderStatus = IOrder['status'];
type PaymentMethod = IOrder['paymentMethod'];
type PaymentStatus = IOrder['paymentStatus'];

type TSearch = {
  orderCode?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  createdAtRange?: string[];
};

const { Text, Link } = Typography;
const { useBreakpoint } = Grid;

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

const paymentMethodMap: Record<PaymentMethod, string> = {
  COD: 'COD',
  ONLINE: 'VNPay',
};

const getCustomerName = (order: IOrder) => {
  if (order.userId && typeof order.userId === 'object') {
    return order.userId.fullName || '---';
  }

  return order.shippingAddress?.fullName || '---';
};

const getCustomerEmail = (order: IOrder) => {
  if (order.userId && typeof order.userId === 'object') {
    return order.userId.email || '---';
  }

  return '---';
};

const getTotalBooks = (order: IOrder) => {
  return order.items?.reduce((total, item) => total + item.quantity, 0) || 0;
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

const TableOrder = () => {
  const actionRef = useRef<ActionType>();
  const pageTopRef = useRef<HTMLDivElement | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [meta, setMeta] = useState({
    current: 1,
    pageSize: 5,
    pages: 0,
    total: 0,
  });

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const { message, notification } = App.useApp();

  const scrollToTableTop = () => {
    requestAnimationFrame(() => {
      const topPosition = pageTopRef.current
        ? pageTopRef.current.getBoundingClientRect().top + window.scrollY - 84
        : 0;

      window.scrollTo({
        top: Math.max(topPosition, 0),
        left: 0,
        behavior: 'auto',
      });
    });
  };

  const refreshTable = () => {
    actionRef.current?.reload();
  };

  useEffect(() => {
    const handleNewOrder = () => {
      refreshTable();
    };

    window.addEventListener('admin:order:new', handleNewOrder);

    return () => {
      window.removeEventListener('admin:order:new', handleNewOrder);
    };
  }, []);

  const openOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setOpenDetail(true);
  };

  const closeOrderDetail = () => {
    setOpenDetail(false);
    setSelectedOrderId(null);
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);

    try {
      const res = await updateOrderStatusAPI(orderId, nextStatus);

      if (res.data) {
        message.success('Cập nhật trạng thái đơn hàng thành công.');

        refreshTable();
        window.dispatchEvent(new CustomEvent('admin:orders:pending-refresh'));

        if (selectedOrderId === orderId) {
          setDetailRefreshKey((current) => current + 1);
        }

        return;
      }

      notification.error({
        message: 'Không thể cập nhật trạng thái đơn hàng',
        description: Array.isArray(res.error?.message)
          ? res.error.message[0]
          : res.error?.message || 'Vui lòng kiểm tra lại trạng thái đơn hàng.',
      });
    } catch (error: any) {
      notification.error({
        message: 'Không thể cập nhật trạng thái đơn hàng',
        description: getErrorDescription(error, 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.'),
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderStatusTag = (status: OrderStatus) => (
    <Tag className="admin-order-table__tag" color={orderStatusMap[status].color}>
      {orderStatusMap[status].text}
    </Tag>
  );

  const renderPaymentTag = (paymentStatus: PaymentStatus) => (
    <Tag className="admin-order-table__tag" color={paymentStatusMap[paymentStatus].color}>
      {paymentStatusMap[paymentStatus].text}
    </Tag>
  );

  const renderOrderActionDropdown = (order: IOrder) => {
    const isLoading = updatingOrderId === order._id;

    const actionItems: MenuProps['items'] = [
      {
        key: 'detail',
        icon: <EyeOutlined />,
        label: 'Xem chi tiết',
        onClick: () => openOrderDetail(order._id),
      },
    ];

    if (order.status === 'PENDING') {
      actionItems.push(
        {
          type: 'divider',
        },
        {
          key: 'confirm',
          icon: <CheckCircleOutlined />,
          label: (
            <Popconfirm
              title="Xác nhận đơn hàng"
              description="Bạn có chắc muốn xác nhận đơn hàng này?"
              okText="Xác nhận"
              cancelText="Đóng"
              onConfirm={() => handleUpdateOrderStatus(order._id, 'CONFIRMED')}
            >
              <span>Xác nhận đơn</span>
            </Popconfirm>
          ),
        },
        {
          key: 'cancel',
          danger: true,
          icon: <CloseCircleOutlined />,
          label: (
            <Popconfirm
              title="Hủy đơn hàng"
              description="Bạn có chắc muốn hủy đơn hàng này?"
              okText="Hủy đơn"
              cancelText="Đóng"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
            >
              <span>Hủy đơn</span>
            </Popconfirm>
          ),
        },
      );
    }

    if (order.status === 'CONFIRMED') {
      actionItems.push(
        {
          type: 'divider',
        },
        {
          key: 'shipping',
          icon: <SendOutlined />,
          label: (
            <Popconfirm
              title="Bắt đầu giao hàng"
              description="Chuyển đơn hàng sang trạng thái đang giao?"
              okText="Giao hàng"
              cancelText="Đóng"
              onConfirm={() => handleUpdateOrderStatus(order._id, 'SHIPPING')}
            >
              <span>Chuyển sang giao hàng</span>
            </Popconfirm>
          ),
        },
        {
          key: 'cancel',
          danger: true,
          icon: <CloseCircleOutlined />,
          label: (
            <Popconfirm
              title="Hủy đơn hàng"
              description="Bạn có chắc muốn hủy đơn hàng này?"
              okText="Hủy đơn"
              cancelText="Đóng"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
            >
              <span>Hủy đơn</span>
            </Popconfirm>
          ),
        },
      );
    }

    if (order.status === 'SHIPPING') {
      actionItems.push(
        {
          type: 'divider',
        },
        {
          key: 'complete',
          icon: <CheckCircleOutlined />,
          label: (
            <Popconfirm
              title="Hoàn thành đơn hàng"
              description="Xác nhận đơn hàng đã được giao thành công?"
              okText="Hoàn thành"
              cancelText="Đóng"
              onConfirm={() => handleUpdateOrderStatus(order._id, 'COMPLETED')}
            >
              <span>Hoàn thành đơn</span>
            </Popconfirm>
          ),
        },
      );
    }

    return (
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: actionItems,
        }}
      >
        <Button size="small" loading={isLoading} className="admin-order-table__action-dropdown">
          Thao tác <DownOutlined />
        </Button>
      </Dropdown>
    );
  };

  const columns: ProColumns<IOrder>[] = useMemo(
    () => [
      {
        title: 'Đơn hàng',
        dataIndex: 'orderCode',
        width: '42%',
        render: (_, order) => {
          const customerName = getCustomerName(order);
          const customerEmail = getCustomerEmail(order);
          const totalBooks = getTotalBooks(order);

          return (
            <div className="admin-order-table__order-cell">
              <Tooltip title={`${order.orderCode} - Nhấn để xem chi tiết`}>
                <Link
                  className="admin-order-table__order-code"
                  onClick={() => openOrderDetail(order._id)}
                >
                  {order.orderCode}
                </Link>
              </Tooltip>

              <div className="admin-order-table__order-meta">
                <span>{customerName}</span>
                <span>{totalBooks} cuốn sách</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>

              <Text type="secondary" ellipsis className="admin-order-table__customer-email">
                {customerEmail}
              </Text>
            </div>
          );
        },
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalPrice',
        width: '15%',
        align: 'right',
        hideInSearch: true,
        render: (_, order) => (
          <Text strong className="admin-order-table__price">
            {formatCurrency(order.totalPrice)}
          </Text>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'statusInfo',
        width: '27%',
        hideInSearch: true,
        render: (_, order) => (
          <div className="admin-order-table__status-cell">
            <div className="admin-order-table__status-row">
              <Text type="secondary">Đơn hàng</Text>
              {renderStatusTag(order.status)}
            </div>

            <div className="admin-order-table__status-row">
              <Text type="secondary">Thanh toán</Text>
              {renderPaymentTag(order.paymentStatus)}
            </div>

            <div className="admin-order-table__status-row">
              <Text type="secondary">Phương thức</Text>
              <Text strong>{paymentMethodMap[order.paymentMethod]}</Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Thao tác',
        valueType: 'option',
        width: '16%',
        align: 'right',
        hideInSearch: true,
        render: (_, order) => renderOrderActionDropdown(order),
      },
      {
        title: 'Trạng thái đơn',
        dataIndex: 'status',
        valueType: 'select',
        hideInTable: true,
        valueEnum: {
          PENDING: {
            text: 'Chờ xác nhận',
          },
          CONFIRMED: {
            text: 'Đã xác nhận',
          },
          SHIPPING: {
            text: 'Đang giao hàng',
          },
          COMPLETED: {
            text: 'Hoàn thành',
          },
          CANCELLED: {
            text: 'Đã hủy',
          },
        },
      },
      {
        title: 'Trạng thái thanh toán',
        dataIndex: 'paymentStatus',
        valueType: 'select',
        hideInTable: true,
        valueEnum: {
          UNPAID: {
            text: 'Chưa thanh toán',
          },
          PAID: {
            text: 'Đã thanh toán',
          },
          REFUNDED: {
            text: 'Đã hoàn tiền',
          },
        },
      },
      {
        title: 'Phương thức thanh toán',
        dataIndex: 'paymentMethod',
        valueType: 'select',
        hideInTable: true,
        valueEnum: {
          COD: {
            text: 'Thanh toán khi nhận hàng',
          },
          ONLINE: {
            text: 'VNPay',
          },
        },
      },
      {
        title: 'Khoảng ngày tạo',
        dataIndex: 'createdAtRange',
        valueType: 'dateRange',
        hideInTable: true,
      },
    ],
    [updatingOrderId, selectedOrderId],
  );

  const handleRequest: ProTableProps<IOrder, TSearch>['request'] = async (params, sort) => {
    const queryParts: string[] = [];

    if (sort?.createdAt) {
      queryParts.push(`sort=${sort.createdAt === 'ascend' ? 'createdAt' : '-createdAt'}`);
    } else {
      queryParts.push('sort=-createdAt');
    }

    if (params.orderCode?.trim()) {
      queryParts.push(`orderCode=/${params.orderCode.trim()}/i`);
    }

    if (params.status) {
      queryParts.push(`status=${params.status}`);
    }

    if (params.paymentMethod) {
      queryParts.push(`paymentMethod=${params.paymentMethod}`);
    }

    if (params.paymentStatus) {
      queryParts.push(`paymentStatus=${params.paymentStatus}`);
    }

    const createdDateRange = dateRangeValidate(params.createdAtRange);

    if (createdDateRange) {
      queryParts.push(`createdAt>=${createdDateRange[0].toISOString()}`);
      queryParts.push(`createdAt<=${createdDateRange[1].toISOString()}`);
    }

    try {
      const res = await getAllOrdersAPI(
        params.current || 1,
        params.pageSize || 5,
        queryParts.join('&'),
      );

      if (res.data) {
        setMeta(res.data.meta);

        return {
          data: res.data.result,
          success: true,
          total: res.data.meta.total,
        };
      }

      notification.error({
        message: 'Không thể tải danh sách đơn hàng',
        description: Array.isArray(res.error?.message)
          ? res.error.message[0]
          : res.error?.message || 'Có lỗi xảy ra.',
      });

      return {
        data: [],
        success: false,
        total: 0,
      };
    } catch (error: any) {
      notification.error({
        message: 'Không thể tải danh sách đơn hàng',
        description: getErrorDescription(error, 'Đã xảy ra lỗi khi tải dữ liệu.'),
      });

      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <div className="admin-order-table" ref={pageTopRef}>
      <ProTable<IOrder, TSearch>
        columns={columns}
        actionRef={actionRef}
        request={handleRequest}
        rowKey="_id"
        cardBordered
        tableLayout="fixed"
        className="admin-order-table__pro-table"
        headerTitle={
          <div className="admin-order-table__title">
            <div className="admin-order-table__title-icon">
              <ShoppingCartOutlined />
            </div>

            <div>
              <Text strong>Quản lý đơn hàng</Text>
              <span>Theo dõi, xác nhận và cập nhật trạng thái đơn hàng</span>
            </div>
          </div>
        }
        search={{
          labelWidth: 'auto',
          defaultCollapsed: isMobile,
          span: {
            xs: 24,
            sm: 24,
            md: 12,
            lg: 8,
            xl: 8,
            xxl: 6,
          },
        }}
        onSubmit={() => scrollToTableTop()}
        onReset={() => scrollToTableTop()}
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng ${total} đơn hàng`,
          onChange: () => scrollToTableTop(),
          onShowSizeChange: () => scrollToTableTop(),
        }}
        options={{
          reload: true,
          density: !isMobile,
          setting: false,
        }}
      />

      <DetailOrder
        open={openDetail}
        orderId={selectedOrderId}
        refreshKey={detailRefreshKey}
        onClose={closeOrderDetail}
      />
    </div>
  );
};

export default TableOrder;
