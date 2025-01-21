import { getUsersAPI } from '@/services/api';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import { useRef, useState } from 'react';
import { AiOutlineEdit } from "react-icons/ai";
import { MdDeleteOutline } from "react-icons/md";

const columns: ProColumns<IUserTable>[] = [
    {
        dataIndex: 'index',
        valueType: 'indexBorder',
        width: 48,
    },
    {
        title: '_id',
        dataIndex: '_id',
        hideInSearch: true,
        render(dom, entity, index, action, schema) {
            return (
                <a href="#">{entity._id}</a>
            )
        },
    },
    {
        title: 'Full name',
        dataIndex: 'fullName',
    },
    {
        title: 'Email',
        dataIndex: 'email',
        copyable: true,
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
    },
    {
        title: 'Action',
        hideInSearch: true,
        render(dom, entity, index, action, schema) {
            return (
                <>
                    <AiOutlineEdit
                        color='#f57800'
                        style={{ cursor: 'pointer', marginRight: 15 }}
                    />
                    <MdDeleteOutline
                        color='#ff4d4f'
                        style={{ cursor: 'pointer' }}
                    />
                </>
            )
        },
    },
];

const TableUser = () => {
    const actionRef = useRef<ActionType>();
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 5,
        pages: 2,
        total: 9
    });
    return (
        <>
            <ProTable<IUserTable>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                request={async (params, sort, filter) => {
                    console.log(sort, filter);
                    const res = await getUsersAPI();
                    if (res.data) {
                        setMeta(res.data.meta);
                    };

                    return {
                        data: res.data?.result,
                        page: 1,
                        success: true,
                        total: res.data?.meta.total,
                    }
                }}
                rowKey="_id"
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    showSizeChanger: true,
                    total: meta.total,
                    showTotal: (total, range) => { return (<div> {range[0]}-{range[1]} on {total} rows</div>) }
                }}
                headerTitle="Table user"
                toolBarRender={() => [
                    <Button
                        key="button"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            actionRef.current?.reload();
                        }}
                        type="primary"
                    >
                        Add new
                    </Button>

                ]}
            />
        </>
    );
};

export default TableUser;