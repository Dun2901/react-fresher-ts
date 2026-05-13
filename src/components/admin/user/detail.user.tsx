import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Descriptions, Tag, Avatar } from "antd";
import { getUserByIdAPI } from "@/services/api";
import dayjs from "dayjs";
import { getAvatarUrl } from "@/services/helper";

const DetailUser = () => {
  const { id } = useParams();

  const [user, setUser] = useState<IUserTable | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        const res = await getUserByIdAPI(id);

        if (res.data) {
          setUser(res.data);
        }
      }
    };

    fetchUser();
  }, [id]);

  return (
    <>
      <Descriptions title="User Detail" bordered column={1}>
        <Descriptions.Item label="ID">{user?._id}</Descriptions.Item>

        <Descriptions.Item label="Avatar">
          <Avatar src={<img src={getAvatarUrl(user?.avatar)} />} size={64} />
        </Descriptions.Item>

        <Descriptions.Item label="Full Name">{user?.fullName}</Descriptions.Item>

        <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>

        <Descriptions.Item label="Phone">{user?.phone}</Descriptions.Item>

        <Descriptions.Item label="Role">
          <Tag color={user?.role === "ADMIN" ? "red" : "blue"}>{user?.role}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Account Type">
          <Tag color={user?.accountType === "GOOGLE" ? "orange" : "default"}>
            {user?.accountType}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag color={user?.isActive ? "green" : "red"}>
            {user?.isActive ? "Đã xác thực" : "Chưa xác thực"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {user?.createdAt ? dayjs(user.createdAt).format("DD/MM/YYYY HH:mm:ss") : ""}
        </Descriptions.Item>

        <Descriptions.Item label="Updated At">
          {user?.updatedAt ? dayjs(user.updatedAt).format("DD/MM/YYYY HH:mm:ss") : ""}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default DetailUser;
