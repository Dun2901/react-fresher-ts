import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Descriptions } from "antd";
import { getUserByIdAPI } from "@/services/api";

const DetailUser = () => {

    const { id } = useParams();

    const [user, setUser] = useState<any>(null);

    useEffect(() => {

        const fetchUser = async () => {

            if (id) {

                const res = await getUserByIdAPI(id);

                console.log(res);

                if (res.data) {
                    setUser(res.data);
                }
            }
        }

        fetchUser();

    }, [id]);

    return (
        <Descriptions
            title="User Detail"
            bordered
            column={1}
        >
            <Descriptions.Item label="ID">
                {user?._id}
            </Descriptions.Item>

            <Descriptions.Item label="Full Name">
                {user?.fullName}
            </Descriptions.Item>

            <Descriptions.Item label="Email">
                {user?.email}
            </Descriptions.Item>

            <Descriptions.Item label="Phone">
                {user?.phone}
            </Descriptions.Item>

            <Descriptions.Item label="Role">
                {user?.role}
            </Descriptions.Item>

            <Descriptions.Item label="Created At">
                {user?.createdAt}
            </Descriptions.Item>
        </Descriptions>
    )
}

export default DetailUser;