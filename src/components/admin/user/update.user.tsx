import { updateUserAPI, uploadAvatarAPI } from "@/services/api";
import { getAvatarUrl } from "@/services/helper";
import { UploadOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Upload,
  UploadFile,
  UploadProps,
} from "antd";
import { FormProps } from "antd/lib";
import { RcFile } from "antd/lib/upload";
import { useEffect, useState } from "react";

interface IProps {
  openModalUpdate: boolean;
  setOpenModalUpdate: (v: boolean) => void;
  dataUpdate: IUserTable | null;
  setDataUpdate: (v: IUserTable | null) => void;
  refreshTable: () => void;
}

type FieldType = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
};

const UpdateUser = (props: IProps) => {
  const { openModalUpdate, setOpenModalUpdate, dataUpdate, refreshTable } = props;
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<string>(""); // tên file lưu DB
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        _id: dataUpdate._id,
        email: dataUpdate.email,
        fullName: dataUpdate.fullName,
        phone: dataUpdate.phone,
      });
      setUserAvatar(dataUpdate.avatar ?? "");

      // ← set fileList nếu có avatar
      if (dataUpdate.avatar) {
        setFileList([
          {
            uid: "-1",
            name: dataUpdate.avatar,
            status: "done",
            url: getAvatarUrl(dataUpdate.avatar),
          },
        ]);
      } else {
        setFileList([]);
      }
    }
  }, [form, dataUpdate, openModalUpdate]); // ← thêm openModalUpdate để khi click vào cùng 1 user 2 lần sẽ ko bị rỗng nữa

  // Reset khi đóng modal
  const handleCancel = () => {
    setOpenModalUpdate(false);
    form.resetFields(); // ← reset form
    setUserAvatar("");
    setFileList([]); // ← reset fileList
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const { _id, fullName, phone } = values;
    setIsSubmit(true);
    const res = await updateUserAPI(_id, fullName, phone, userAvatar);
    if (res && res.data) {
      message.success("Cập nhật user thành công.");
      form.resetFields();
      setOpenModalUpdate(false);
      refreshTable();
    } else {
      notification.error({
        message: "Đã có lỗi xảy ra!",
        description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
      });
    }
    setIsSubmit(false);
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ chấp nhận file ảnh!");
    }

    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error("Ảnh phải nhỏ hơn 1MB!");
    }

    return isImage && isLt1M;
  };

  const handleUploadAvatar: UploadProps["customRequest"] = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadAvatarAPI(formData);

      const fileName = res.data?.fileUploaded;
      if (fileName) {
        setUserAvatar(fileName);
        setFileList([
          {
            uid: (file as RcFile).uid,
            name: fileName,
            status: "done",
            url: getAvatarUrl(fileName),
          },
        ]);
        message.success("Tải ảnh thành công.");
        onSuccess?.("ok");
      } else {
        notification.error({
          message: "Đã có lỗi xảy ra!",
          description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
        });
      }
    } catch (err) {
      message.error("Tải ảnh thất bại!");
      onError?.(err as Error);
    }
  };

  return (
    <>
      <Modal
        title="Cập nhật người dùng"
        maskClosable={false}
        centered
        confirmLoading={isSubmit}
        open={openModalUpdate}
        onOk={() => form.submit()}
        onCancel={handleCancel}
        okText={"Cập nhật"}
        cancelText={"Hủy"}
      >
        <Divider />

        <Form
          form={form}
          name="form-update user"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="ID"
            name="_id"
            hidden
          >
            <Input disabled />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Email"
            name="email"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Tên hiển thị"
            name="fullName"
            rules={[{ required: true, message: "Tên hiển thị không được để trống!" }]}
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
          {/* Avatar field */}
          <Form.Item<FieldType>
            labelCol={{ span: 24 }} //whole column
            label="Avatar"
          >
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Upload
                customRequest={handleUploadAvatar}
                beforeUpload={beforeUpload}
                listType="picture"
                maxCount={1}
                fileList={fileList}
                onRemove={() => {
                  setFileList([]);
                  setUserAvatar("");
                }}
              >
                <Button icon={<UploadOutlined />}>Tải ảnh (Tối đa: 1)</Button>
              </Upload>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default UpdateUser;
