import AppBreadcrumb from "@/components/share/breadcrumb";
import { getUsersAPI } from "@/services/api";
import { dateRangeValidate } from "@/services/helper";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { ProTable } from "@ant-design/pro-components";
import { Button } from "antd";
import { useRef, useState } from "react";
import { AiOutlineEdit } from "react-icons/ai";
import { MdDeleteOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import CreateUser from "./create.user";
import UpdateUser from "./update.user";

type TSearch = {
  fullName: string;
  email: string;
  createdAt: string;
  createdAtRange: string;
};

const TableUser = () => {
  const actionRef = useRef<ActionType>();
  const [meta, setMeta] = useState({
    current: 1,
    pageSize: 5,
    pages: 2,
    total: 9,
  });
  const [openModalCreate, setOpenModalCreate] = useState<boolean>(false);
  const [openModalUpdate, setOpenModalUpdate] = useState<boolean>(false);
  const [dataUpdate, setDataUpdate] = useState<IUserTable | null>(null);

  const refreshTable = () => {
    actionRef.current?.reload();
  };

  const columns: ProColumns<IUserTable>[] = [
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
        return <Link to={`/admin/user/${entity._id}`}>{entity._id}</Link>;
      },
    },
    {
      title: "Full name",
      dataIndex: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      copyable: true,
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
            <MdDeleteOutline color="#ff4d4f" style={{ cursor: "pointer" }} />
          </>
        );
      },
    },
  ];

  return (
    <>
      <AppBreadcrumb items={[{ icon: <TeamOutlined />, label: "Quản lý người dùng" }]} />

      <ProTable<IUserTable, TSearch>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params, sort, filter) => {
          console.log(params, sort, filter);

          let query = "";
          if (params) {
            query += `current=${params.current}&pageSize=${params.pageSize}`;
            //đăng kí sau thì lên trước
            if (sort && sort.createdAt) {
              query += `&sort=${sort.createdAt === "ascend" ? "createdAt" : "-createdAt"}`;
            } else {
              query += `&sort=-createdAt`;
            }

            if (params.email) {
              query += `&email=/${params.email}/i`;
            }
            if (params.fullName) {
              query += `&fullName=/${params.fullName}/i`;
            }

            const createDateRange = dateRangeValidate(params.createdAtRange);
            if (createDateRange) {
              query += `&createdAt>=${createDateRange[0]}&createdAt<=${createDateRange[1]}`;
            }
          }

          const res = await getUsersAPI(query);
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
        headerTitle="Table user"
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

      <CreateUser
        openModalCreate={openModalCreate}
        setOpenModalCreate={setOpenModalCreate}
        refreshTable={refreshTable}
      />
      <UpdateUser
        openModalUpdate={openModalUpdate}
        setOpenModalUpdate={setOpenModalUpdate}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default TableUser;
