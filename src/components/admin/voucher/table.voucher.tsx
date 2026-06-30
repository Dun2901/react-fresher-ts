import { deleteVoucherAPI, getVouchersAPI } from '@/services/api';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import { useRef, useState } from 'react';
import { AiOutlineEdit } from 'react-icons/ai';
import VoucherModal from './modal.voucher';
import { formatCurrency } from '@/services/helper';
import dayjs from 'dayjs';

type TSearch = {
  code?: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
};

const TableVoucher = () => {
  const tableRef = useRef<ActionType>();

  const [meta, setMeta] = useState({
    current: 1,
    pageSize: 5,
    pages: 0,
    total: 0,
  });

  const [openModal, setOpenModal] = useState(false);
  const [dataUpdate, setDataUpdate] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { message, notification } = App.useApp();

  const refreshTable = () => {
    tableRef.current?.reload();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteVoucherAPI(id);
      if (res?.data) {
        message.success('Xóa mã giảm giá thành công!');
        refreshTable();
        return;
      }
      notification.error({
        message: 'Không thể xóa mã giảm giá',
        description: res?.error?.message || 'Lỗi bất ngờ.',
      });
    } catch (error: any) {
      console.error('Delete voucher error:', error);
      notification.error({
        message: 'Không thể xóa mã giảm giá',
        description: error?.response?.data?.message || 'Có lỗi xảy ra.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ProColumns<any>[] = [
    {
      title: 'STT',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 50,
    },
    {
      title: 'Mã (Code)',
      dataIndex: 'code',
      render: (text) => <b style={{ color: '#ea580c' }}>{text}</b>,
    },
    {
      title: 'Loại giảm',
      dataIndex: 'discountType',
      valueType: 'select',
      valueEnum: {
        FIXED: 'Số tiền cố định',
        PERCENTAGE: 'Phần trăm (%)',
      },
      render: (_, record) => (
        <Tag color={record.discountType === 'FIXED' ? 'blue' : 'purple'}>
          {record.discountType === 'FIXED' ? 'Tiền mặt' : 'Phần trăm (%)'}
        </Tag>
      ),
    },
    {
      title: 'Giá trị giảm',
      dataIndex: 'discountValue',
      search: false,
      render: (_, record) => {
        if (record.discountType === 'PERCENTAGE') {
          return `${record.discountValue}% (Tối đa ${record.maxDiscountValue ? formatCurrency(record.maxDiscountValue) : 'Không giới hạn'})`;
        }
        return formatCurrency(record.discountValue);
      },
    },
    {
      title: 'Đơn hàng tối thiểu',
      dataIndex: 'minOrderValue',
      search: false,
      render: (val) => formatCurrency(Number(val || 0)),
    },
    {
      title: 'Lượt dùng (Đã dùng/Tổng)',
      dataIndex: 'usageLimit',
      search: false,
      render: (_, record) => {
        const limit = record.usageLimit === 0 ? 'Không giới hạn' : record.usageLimit;
        return `${record.usedCount} / ${limit}`;
      },
    },
    {
      title: 'Ngày hiệu lực',
      dataIndex: 'startDate',
      search: false,
      render: (_, record) => {
        if (!record.startDate || !record.endDate) return 'Vô hạn';
        return (
          <span style={{ fontSize: '12px' }}>
            {dayjs(record.startDate).format('DD-MM-YYYY HH:mm')} đến{' '}
            {dayjs(record.endDate).format('DD-MM-YYYY HH:mm')}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      valueType: 'select',
      valueEnum: {
        true: 'Kích hoạt',
        false: 'Vô hiệu hóa',
      },
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      key: 'option',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<AiOutlineEdit style={{ color: '#fb923c', fontSize: '18px' }} />}
            onClick={() => {
              setDataUpdate(record);
              setOpenModal(true);
            }}
          />
          <Popconfirm
            placement="leftTop"
            title="Xác nhận xóa mã giảm giá này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ loading: deletingId === record._id }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ProTable<any, TSearch>
        actionRef={tableRef}
        columns={columns}
        cardBordered
        request={async (params = {}) => {
          const { current = 1, pageSize = 5, code, discountType } = params;
          let queryStr = '';
          const filters: string[] = [];

          if (code) {
            filters.push(`code=/.*${code.trim()}.*/i`);
          }
          if (discountType) {
            filters.push(`discountType=${discountType}`);
          }

          if (filters.length) {
            queryStr = filters.join('&');
          }

          const res = await getVouchersAPI(current, pageSize, queryStr);
          if (res?.data) {
            setMeta({
              current: res.data.meta.current,
              pageSize: res.data.meta.pageSize,
              pages: res.data.meta.pages,
              total: res.data.meta.total,
            });
            return {
              data: res.data.result,
              success: true,
              total: res.data.meta.total,
            };
          }
          return { data: [], success: false };
        }}
        rowKey="_id"
        search={{ labelWidth: 'auto' }}
        options={{
          setting: { listsHeight: 400 },
        }}
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
          onChange: (page, pageSize) => {
            setMeta((prev) => ({ ...prev, current: page, pageSize }));
          },
        }}
        headerTitle="Danh sách mã giảm giá (Vouchers)"
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => {
              setDataUpdate(null);
              setOpenModal(true);
            }}
            type="primary"
          >
            Tạo mã mới
          </Button>,
          <Button
            key="reload"
            type="text"
            icon={<ReloadOutlined />}
            onClick={refreshTable}
          />,
        ]}
      />

      <VoucherModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        refreshTable={refreshTable}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
      />
    </div>
  );
};

export default TableVoucher;
