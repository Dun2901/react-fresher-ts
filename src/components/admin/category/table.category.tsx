import {
  deleteCategoryAPI,
  getCategoriesAPI,
  getDeletedCategoriesAPI,
  restoreCategoryAPI,
} from '@/services/api';
import { DeleteOutlined, PlusOutlined, ReloadOutlined, UndoOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Empty, Popconfirm, Space, Tabs, Tag, Tooltip } from 'antd';
import { useRef, useState } from 'react';
import { AiOutlineEdit } from 'react-icons/ai';
import UpdateCategory from './update.category';
import CreateCategory from './create.category';

type TSearch = {
  name?: string;
  slug?: string;
};

type CategoryTab = 'active' | 'deleted';

const TableCategory = () => {
  const activeTableRef = useRef<ActionType>();
  const deletedTableRef = useRef<ActionType>();

  const [activeTab, setActiveTab] = useState<CategoryTab>('active');

  const [meta, setMeta] = useState({
    current: 1,
    pageSize: 5,
    pages: 0,
    total: 0,
  });

  const [openModalCreate, setOpenModalCreate] = useState(false);
  const [openModalUpdate, setOpenModalUpdate] = useState(false);
  const [dataUpdate, setDataUpdate] = useState<ICategory | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { message, notification } = App.useApp();

  const refreshActiveTable = () => {
    activeTableRef.current?.reload();
  };

  const refreshDeletedTable = () => {
    deletedTableRef.current?.reload();
  };

  const refreshAllTables = () => {
    refreshActiveTable();
    refreshDeletedTable();
  };

  const getErrorMessage = (errorMessage: string | string[] | undefined) => {
    if (Array.isArray(errorMessage)) {
      return errorMessage[0];
    }

    return errorMessage || 'Có lỗi xảy ra, vui lòng thử lại.';
  };

  /**
   * Soft delete category.
   */
  const handleDeleteCategory = async (id: string) => {
    setDeletingId(id);

    try {
      const res = await deleteCategoryAPI(id);

      if (res?.data) {
        message.success('Xóa danh mục thành công!');
        refreshAllTables();
        return;
      }

      notification.error({
        message: 'Không thể xóa danh mục',
        description: getErrorMessage(res?.error?.message),
      });
    } catch (error) {
      console.error('Delete category error:', error);

      notification.error({
        message: 'Không thể xóa danh mục',
        description: 'Có lỗi xảy ra khi xóa danh mục.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Restore category đã bị soft delete.
   */
  const handleRestoreCategory = async (id: string) => {
    setRestoringId(id);

    try {
      const res = await restoreCategoryAPI(id);

      if (res?.data) {
        message.success('Khôi phục danh mục thành công!');
        refreshAllTables();
        return;
      }

      notification.error({
        message: 'Không thể khôi phục danh mục',
        description: getErrorMessage(res?.error?.message),
      });
    } catch (error) {
      console.error('Restore category error:', error);

      notification.error({
        message: 'Không thể khôi phục danh mục',
        description: 'Có lỗi xảy ra khi khôi phục danh mục.',
      });
    } finally {
      setRestoringId(null);
    }
  };

  const commonColumns: ProColumns<ICategory>[] = [
    {
      title: 'STT',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 55,
      hideInSearch: true,
    },
    {
      title: 'ID',
      dataIndex: '_id',
      width: 190,
      hideInSearch: true,
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      width: 170,
      copyable: true,
      ellipsis: true,
      render: (_, entity) => {
        return entity.slug ? <Tag color="blue">{entity.slug}</Tag> : '-';
      },
    },
  ];

  const activeColumns: ProColumns<ICategory>[] = [
    ...commonColumns,
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
      width: 165,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 110,
      hideInSearch: true,
      render: () => <Tag color="success">Hoạt động</Tag>,
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 90,
      render: (_, entity) => {
        return (
          <Space size={14}>
            <Tooltip title="Cập nhật danh mục">
              <AiOutlineEdit
                size={19}
                color="var(--color-primary-hover)"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setDataUpdate(entity);
                  setOpenModalUpdate(true);
                }}
              />
            </Tooltip>

            <Popconfirm
              placement="leftTop"
              title="Xác nhận xóa danh mục"
              description="Danh mục sẽ được chuyển vào danh sách đã xóa."
              onConfirm={() => handleDeleteCategory(entity._id)}
              okText="Xác nhận xóa"
              cancelText="Hủy"
              okButtonProps={{
                danger: true,
                loading: deletingId === entity._id,
              }}
            >
              <Tooltip title="Xóa danh mục">
                <DeleteOutlined
                  style={{
                    cursor: 'pointer',
                    color: '#ff4d4f',
                    fontSize: 18,
                  }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const deletedColumns: ProColumns<ICategory>[] = [
    ...commonColumns.map((column) => ({
      ...column,
      hideInSearch: true,
    })),
    {
      title: 'Ngày xóa',
      dataIndex: 'deletedAt',
      valueType: 'dateTime',
      width: 165,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'deleted',
      width: 110,
      hideInSearch: true,
      render: () => <Tag color="error">Đã xóa</Tag>,
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 120,
      render: (_, entity) => {
        return (
          <Popconfirm
            placement="leftTop"
            title="Khôi phục danh mục"
            description="Bạn có chắc muốn khôi phục danh mục này?"
            onConfirm={() => handleRestoreCategory(entity._id)}
            okText="Khôi phục"
            cancelText="Hủy"
            okButtonProps={{
              loading: restoringId === entity._id,
            }}
          >
            <Button
              type="link"
              icon={<UndoOutlined />}
              loading={restoringId === entity._id}
              style={{ padding: 0 }}
            >
              Khôi phục
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  const activeCategoryTable = (
    <ProTable<ICategory, TSearch>
      columns={activeColumns}
      search={{
        labelWidth: 110,
      }}
      actionRef={activeTableRef}
      cardBordered
      rowKey="_id"
      request={async (params, sort) => {
        try {
          let query = `current=${params.current}&pageSize=${params.pageSize}`;

          if (sort?.createdAt) {
            query += `&sort=${sort.createdAt === 'ascend' ? 'createdAt' : '-createdAt'}`;
          } else {
            query += '&sort=-createdAt';
          }

          if (params.name) {
            query += `&name=/${params.name}/i`;
          }

          if (params.slug) {
            query += `&slug=/${params.slug}/i`;
          }

          const res = await getCategoriesAPI(query);

          if (res?.data) {
            setMeta(res.data.meta);
          }

          return {
            data: res?.data?.result || [],
            success: true,
            total: res?.data?.meta?.total || 0,
          };
        } catch (error) {
          console.error('Get categories error:', error);

          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      pagination={{
        current: meta.current,
        pageSize: meta.pageSize,
        total: meta.total,
        showSizeChanger: true,
        showTotal: (total, range) => (
          <div>
            {range[0]}-{range[1]} trên {total} danh mục
          </div>
        ),
      }}
      headerTitle="Danh mục đang hoạt động"
      toolBarRender={() => [
        <Button key="reload" icon={<ReloadOutlined />} onClick={refreshActiveTable}>
          Làm mới
        </Button>,

        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpenModalCreate(true)}
        >
          Thêm danh mục
        </Button>,
      ]}
    />
  );

  const deletedCategoryTable = (
    <ProTable<ICategory>
      columns={deletedColumns}
      actionRef={deletedTableRef}
      cardBordered
      rowKey="_id"
      search={false}
      pagination={false}
      request={async () => {
        try {
          const res = await getDeletedCategoriesAPI();

          return {
            data: res?.data || [],
            success: true,
            total: res?.data?.length || 0,
          };
        } catch (error) {
          console.error('Get deleted categories error:', error);

          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      locale={{
        emptyText: <Empty description="Chưa có danh mục nào bị xóa" />,
      }}
      headerTitle="Danh mục đã xóa"
      toolBarRender={() => [
        <Button key="reload-deleted" icon={<ReloadOutlined />} onClick={refreshDeletedTable}>
          Làm mới
        </Button>,
      ]}
    />
  );

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as CategoryTab);
        }}
        items={[
          {
            key: 'active',
            label: 'Danh mục đang hoạt động',
            children: activeCategoryTable,
          },
          {
            key: 'deleted',
            label: 'Danh mục đã xóa',
            children: deletedCategoryTable,
          },
        ]}
      />

      <CreateCategory
        openModalCreate={openModalCreate}
        setOpenModalCreate={setOpenModalCreate}
        refreshTable={refreshAllTables}
      />

      <UpdateCategory
        openModalUpdate={openModalUpdate}
        setOpenModalUpdate={setOpenModalUpdate}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
        refreshTable={refreshAllTables}
      />
    </>
  );
};

export default TableCategory;
