import { createUserAPI } from "@/services/api";
import { App, Divider, Form, Input, Modal, Select } from "antd";
import { FormProps } from "antd/lib";
import { useState } from "react";

interface IProps {
  openModalCreate: boolean;
  setOpenModalCreate: (v: boolean) => void;
  refreshTable: () => void;
}

type FieldType = {
  fullName: string;
  password: string;
  email: string;
  phone: string;
  role: string;
};

const CreateUser = (props: IProps) => {
  const { openModalCreate, setOpenModalCreate, refreshTable } = props;
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  // Reset khi đóng modal
  const handleCancel = () => {
    setOpenModalCreate(false);
    form.resetFields(); // ← reset form
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const { email, fullName, password, phone, role } = values;
    setIsSubmit(true);
    const res = await createUserAPI(email, fullName, password, phone, role);
    if (res && res.data) {
      message.success("Tạo mới user thành công.");
      form.resetFields();
      setOpenModalCreate(false);
      refreshTable();
    } else {
      notification.error({
        message: "Đã có lỗi xảy ra!",
        description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
      });
    }
    setIsSubmit(false);
  };

  return (
    <>
      <Modal
        title="Thêm mới người dùng"
        open={openModalCreate}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        maskClosable={false}
        centered
        okText={"Tạo mới"}
        cancelText={"Hủy"}
        confirmLoading={isSubmit}
      >
        <Divider />

        <Form
          form={form}
          name="form-create new user"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Tên hiển thị"
            name="fullName"
            rules={[{ required: true, message: "Tên không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Mật khẩu không được để trống!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email không được để trống!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Số điện thoại không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            labelCol={{ span: 24 }}
            label="Role"
            name="role"
            rules={[{ required: true, message: "Role không được để trống!" }]}
          >
            <Select placeholder="Chọn role">
              <Select.Option value="USER">User</Select.Option>
              <Select.Option value="ADMIN">Admin</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateUser;
