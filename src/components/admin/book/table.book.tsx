import { deleteBookAPI, getBooksAPI } from "@/services/api";
import { dateRangeValidate } from "@/services/helper";
import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import { App, Button, Popconfirm } from "antd";
import { useRef, useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { MdDeleteOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import CreateBook from "./create.book";
import UpdateBook from "./update.book";

type TSearch = {
  mainText: string;
  author: string;
  category: string;
  createdAt: string;
  createdAtRange: string;
};

const TableBook = () => {
  const actionRef = useRef<ActionType>();
  const [meta, setMeta] = useState({
    current: 1,
    pageSize: 5,
    pages: 2,
    total: 9,
  });
  const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);
  const [openModalUpdate, setOpenModalUpdate] = useState<boolean>(false);
  const [dataUpdate, setDataUpdate] = useState<IBookTable | null>(null);
  const [isDeleteBook, setIsDeleteBook] = useState<boolean>(false);
  const { message, notification } = App.useApp();

  const refreshTable = () => {
    actionRef.current?.reload();
  };

  const handleDeleteBook = async (id: string) => {
    setIsDeleteBook(true);
    const res = await deleteBookAPI(id);
    if (res && res.data) {
      message.success("Xóa sách thành công!");
      refreshTable();
    } else {
      notification.error({
        message: "Có lỗi xảy ra",
        description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
      });
    }
    setIsDeleteBook(false);
  };

  const columns: ProColumns<IBookTable>[] = [
    {
      dataIndex: "index",
      valueType: "indexBorder",
      width: 48,
    },
    {
      title: "_id",
      dataIndex: "_id",
      hideInSearch: true,
      render(dom, entity, index, action, schema) {
        return <Link to={`/admin/books/${entity._id}`}>{entity._id}</Link>;
      },
    },
    {
      title: "Tên sách",
      dataIndex: "mainText",
    },
    {
      title: "Tác giả",
      dataIndex: "author",
    },
    {
      title: "Thể loại",
      dataIndex: "category",
    },
    {
      title: "Giá",
      dataIndex: "price",
      hideInSearch: true,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      hideInSearch: true,
    },
    {
      title: "Đã bán",
      dataIndex: "sold",
      hideInSearch: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      valueType: "date",
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      title: "Action",
      hideInSearch: true,
      render(dom, entity, index, action, schema) {
        return (
          <>
            <AiOutlineEdit
              color="#f57800"
              style={{ cursor: "pointer", marginRight: 15 }}
              onClick={() => {
                console.log(">>> check entity: ", entity);
                setDataUpdate(entity);
                setOpenModalUpdate(true);
              }}
            />
            <Popconfirm
              placement="leftTop"
              title="Xác nhận xóa sách"
              description="Bạn có chắc muốn xóa sách này?"
              onConfirm={() => handleDeleteBook(entity._id)}
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ loading: isDeleteBook }}
            >
              <span style={{ marginLeft: 20 }}>
                <MdDeleteOutline color="#ff4d4f" style={{ cursor: "pointer" }} />
              </span>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  return (
    <>
      <ProTable<IBookTable, TSearch>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params, sort, filter) => {
          console.log(params, sort, filter);

          let query = "";
          if (params) {
            query += `current=${params.current}&pageSize=${params.pageSize}`;
            if (sort && sort.createdAt) {
              query += `&sort=${sort.createdAt === "ascend" ? "createdAt" : "-createdAt"}`;
            } else {
              query += `&sort=-createdAt`;
            }

            if (params.mainText) {
              query += `&mainText=/${params.mainText}/i`;
            }
            if (params.author) {
              query += `&author=/${params.author}/i`;
            }
            if (params.category) {
              query += `&category=/${params.category}/i`;
            }

            const createDateRange = dateRangeValidate(params.createdAtRange);
            if (createDateRange) {
              query += `&createdAt>=${createDateRange[0]}&createdAt<=${createDateRange[1]}`;
            }
          }

          const res = await getBooksAPI(query);
          if (res.data) {
            setMeta(res.data.meta);
          }

          return {
            data: res.data?.result,
            page: 1,
            success: true,
            total: res.data?.meta.total,
          };
        }}
        rowKey="_id"
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          showSizeChanger: true,
          total: meta.total,
          showTotal: (total, range) => {
            return (
              <div>
                {" "}
                {range[0]}-{range[1]} on {total} rows
              </div>
            );
          },
        }}
        headerTitle="Table sách"
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => {
              setOpenModalCreate(true);
            }}
            type="primary"
          >
            Add new
          </Button>,
        ]}
      />

      <CreateBook
        openModalCreate={openModalCreate}
        setOpenModalCreate={setOpenModalCreate}
        refreshTable={refreshTable}
      />
      <UpdateBook
        openModalUpdate={openModalUpdate}
        setOpenModalUpdate={setOpenModalUpdate}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default TableBook;
