import { App, Divider, Form, Input, Modal } from "antd";
import { FormProps } from "antd/lib";
import { useEffect, useState } from "react";

interface IProps {
  openModalUpdate: boolean;
  setOpenModalUpdate: (v: boolean) => void;
  dataUpdate: IBookTable | null;
  setDataUpdate: (v: IBookTable | null) => void;
  refreshTable: () => void;
}

type FieldType = {
  _id: string;
  mainText: string;
  author: string;
  price: number;
  quantity: number;
  category: string;
};

const UpdateBook = (props: IProps) => {
  const { openModalUpdate, setOpenModalUpdate, dataUpdate, setDataUpdate, refreshTable } = props;
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        _id: dataUpdate._id,
        mainText: dataUpdate.mainText,
        author: dataUpdate.author,
        price: dataUpdate.price,
        quantity: dataUpdate.quantity,
        category: dataUpdate.category,
      });
    }
  }, [form, dataUpdate, openModalUpdate]);

  const handleCancel = () => {
    setOpenModalUpdate(false);
    form.resetFields();
    setDataUpdate(null);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const { _id, mainText, author, price, quantity, category } = values;
    setIsSubmit(true);
    try {
      message.success("Cập nhật sách thành công.");
      form.resetFields();
      setOpenModalUpdate(false);
      refreshTable();
    } catch (error) {
      notification.error({
        message: "Đã có lỗi xảy ra!",
        description: "Không thể cập nhật sách",
      });
    }
    setIsSubmit(false);
  };

  return (
    <>
      <Modal
        title="Cập nhật sách"
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
          name="form-update-book"
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            labelCol={{ span: 24 }}
            label="ID"
            name="_id"
            hidden
          >
            <Input disabled />
          </Form.Item>

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

export default UpdateBook;
