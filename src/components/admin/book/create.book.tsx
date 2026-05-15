import { App, Divider, Form, Input, Modal } from "antd";
import { FormProps } from "antd/lib";
import { useState } from "react";

interface IProps {
  openModalCreate: boolean;
  setOpenModalCreate: (v: boolean) => void;
  refreshTable: () => void;
}

type FieldType = {
  mainText: string;
  author: string;
  price: number;
  quantity: number;
  category: string;
};

const CreateBook = (props: IProps) => {
  const { openModalCreate, setOpenModalCreate, refreshTable } = props;
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  const handleCancel = () => {
    setOpenModalCreate(false);
    form.resetFields();
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setIsSubmit(true);
    try {
      message.success("Tạo mới sách thành công.");
      form.resetFields();
      setOpenModalCreate(false);
      refreshTable();
    } catch (error) {
      notification.error({
        message: "Đã có lỗi xảy ra!",
        description: "Không thể tạo sách",
      });
    }
    setIsSubmit(false);
  };

  return (
    <>
      <Modal
        title="Thêm mới sách"
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
          name="form-create-book"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            labelCol={{ span: 24 }}
            label="Tên sách"
            name="mainText"
            rules={[{ required: true, message: "Tên sách không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }}
            label="Tác giả"
            name="author"
            rules={[{ required: true, message: "Tác giả không được để trống!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }}
            label="Giá"
            name="price"
            rules={[{ required: true, message: "Giá không được để trống!" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }}
            label="Số lượng"
            name="quantity"
            rules={[{ required: true, message: "Số lượng không được để trống!" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item<FieldType>
            labelCol={{ span: 24 }}
            label="Thể loại"
            name="category"
            rules={[{ required: true, message: "Thể loại không được để trống!" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateBook;
