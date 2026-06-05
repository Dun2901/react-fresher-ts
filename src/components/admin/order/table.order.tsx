import { CheckCircleOutlined, CloseCircleOutlined, SendOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProTableProps } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import { useRef, useState } from 'react';
import { getAllOrdersAPI, updateOrderStatusAPI } from '@/services/api';
import { dateRangeValidate, formatCurrency } from '@/services/helper';
import DetailOrder from './detail.order';

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

const getCustomerName = (order: IOrder) => {
  if (order.userId && typeof order.userId === 'object') {
    return order.userId.fullName || '---';
  }

  return order.shippingAddress?.fullName || '---';
};

const TableOrder = () => {
  const actionRef = useRef<ActionType>();

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
  const { Link } = Typography;

  const refreshTable = () => {
    actionRef.current?.reload();
  };

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

        if (selectedOrderId === orderId) {
          setDetailRefreshKey((current) => current + 1);
        }

        return;
      }

      notification.error({
        message: 'Không thể chuyển trạng thái đơn hàng này.',
        description: Array.isArray(res.error?.message)
          ? res.error.message[0]
          : res.error?.message || 'Vui lòng kiểm tra lại trạng thái đơn hàng.',
      });
    } catch {
      notification.error({
        message: 'Không thể chuyển trạng thái đơn hàng này.',
        description: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng.',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const renderOrderActions = (order: IOrder) => {
    const isLoading = updatingOrderId === order._id;

    if (order.status === 'PENDING') {
      return (
        <Space size={2}>
          <Tooltip title="Xác nhận đơn hàng">
            <Popconfirm
              title="Xác nhận đơn hàng"
              description="Bạn có chắc muốn xác nhận đơn hàng này?"
              okText="Xác nhận"
              cancelText="Đóng"
              onConfirm={() => handleUpdateOrderStatus(order._id, 'CONFIRMED')}
            >
              <Button
                type="text"
                size="small"
                loading={isLoading}
                icon={
                  <CheckCircleOutlined
                    style={{
                      color: '#1677ff',
                      fontSize: 18,
                    }}
                  />
                }
              />
            </Popconfirm>
          </Tooltip>

          <Tooltip title="Hủy đơn hàng">
            <Popconfirm
              title="Hủy đơn hàng"
              description="Bạn có chắc muốn hủy đơn hàng này?"
              okText="Hủy đơn"
              cancelText="Đóng"
              okButtonProps={{
                danger: true,
              }}
              onConfirm={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
            >
              <Button
                type="text"
                danger
                size="small"
                disabled={isLoading}
                icon={
                  <CloseCircleOutlined
                    style={{
                      fontSize: 18,
                    }}
                  />
                }
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      );
    }

    if (order.status === 'CONFIRMED') {
      return (
        <Space size={2}>
          <Tooltip title="Bắt đầu giao hàng">
            <Popconfirm
              title="Bắt đầu giao hàng"
              description="Bạn có chắc muốn chuyển đơn hàng sang đang giao?"
              okText="Giao hàng"
              cancelText="Đóng"
              onConfirm={() => handleUpdateOrderStatus(order._id, 'SHIPPING')}
            >
              <Button
                type="text"
                size="small"
                loading={isLoading}
                icon={
                  <SendOutlined
                    style={{
                      color: '#1677ff',
                      fontSize: 18,
                    }}
                  />
                }
              />
            </Popconfirm>
          </Tooltip>

          <Tooltip title="Hủy đơn hàng">
            <Popconfirm
              title="Hủy đơn hàng"
              description="Bạn có chắc muốn hủy đơn hàng này?"
              okText="Hủy đơn"
              cancelText="Đóng"
              okButtonProps={{
                danger: true,
              }}
              onConfirm={() => handleUpdateOrderStatus(order._id, 'CANCELLED')}
            >
              <Button
                type="text"
                danger
                size="small"
                disabled={isLoading}
                icon={
                  <CloseCircleOutlined
                    style={{
                      fontSize: 18,
                    }}
                  />
                }
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      );
    }

    if (order.status === 'SHIPPING') {
      return (
        <Tooltip title="Hoàn thành đơn hàng">
          <Popconfirm
            title="Hoàn thành đơn hàng"
            description="Xác nhận đơn hàng đã được giao thành công?"
            okText="Hoàn thành"
            cancelText="Đóng"
            onConfirm={() => handleUpdateOrderStatus(order._id, 'COMPLETED')}
          >
            <Button
              type="text"
              size="small"
              loading={isLoading}
              icon={
                <CheckCircleOutlined
                  style={{
                    color: '#52c41a',
                    fontSize: 18,
                  }}
                />
              }
            />
          </Popconfirm>
        </Tooltip>
      );
    }

    return <span style={{ color: '#bfbfbf' }}>---</span>;
  };

  const columns: ProColumns<IOrder>[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 42,
      hideInSearch: true,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      width: 225,
      render: (_, order) => (
        <Tooltip title={`${order.orderCode} - Nhấn để xem chi tiết`}>
          <Link
            ellipsis
            onClick={() => openOrderDetail(order._id)}
            style={{
              display: 'block',
              maxWidth: '100%',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {order.orderCode}
          </Link>
        </Tooltip>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      width: 125,
      hideInSearch: true,
      ellipsis: true,
      render: (_, order) => {
        const customerName = getCustomerName(order);

        return (
          <Tooltip title={customerName}>
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {customerName}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalPrice',
      width: 115,
      align: 'right',
      hideInSearch: true,
      render: (_, order) => (
        <strong
          style={{
            color: '#cf1322',
            whiteSpace: 'nowrap',
          }}
        >
          {formatCurrency(order.totalPrice)}
        </strong>
      ),
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
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
      render: (_, order) => (
        <Tag
          color={orderStatusMap[order.status].color}
          style={{
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {orderStatusMap[order.status].text}
        </Tag>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      width: 130,
      valueType: 'select',
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
      render: (_, order) => (
        <Tag
          color={paymentStatusMap[order.paymentStatus].color}
          style={{
            margin: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {paymentStatusMap[order.paymentStatus].text}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 105,
      valueType: 'date',
      sorter: true,
      hideInSearch: true,
    },

    // Chỉ dùng để lọc
    {
      title: 'Khoảng ngày tạo',
      dataIndex: 'createdAtRange',
      valueType: 'dateRange',
      hideInTable: true,
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
          text: 'Thanh toán online',
        },
      },
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 75,
      align: 'center',
      hideInSearch: true,
      render: (_, order) => renderOrderActions(order),
    },
  ];
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
    } catch {
      notification.error({
        message: 'Không thể tải danh sách đơn hàng',
        description: 'Đã xảy ra lỗi khi tải dữ liệu.',
      });

      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return (
    <>
      <ProTable<IOrder, TSearch>
        columns={columns}
        actionRef={actionRef}
        request={handleRequest}
        rowKey="_id"
        cardBordered
        tableLayout="fixed"
        headerTitle="Quản lý đơn hàng"
        search={{
          labelWidth: 'auto',
          span: {
            xs: 24,
            sm: 12,
            md: 8,
            lg: 6,
            xl: 6,
            xxl: 6,
          },
        }}
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng ${total} đơn hàng`,
        }}
        options={{
          reload: true,
          density: true,
          setting: false,
        }}
      />

      <DetailOrder
        open={openDetail}
        orderId={selectedOrderId}
        refreshKey={detailRefreshKey}
        onClose={closeOrderDetail}
      />
    </>
  );
};

export default TableOrder;
