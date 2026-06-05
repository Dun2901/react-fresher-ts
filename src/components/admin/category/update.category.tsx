import { updateCategoryAPI } from '@/services/api';
import { App, Form, Input, Modal } from 'antd';
import type { FormProps } from 'antd';
import { useEffect, useState } from 'react';

interface IProps {
  openModalUpdate: boolean;
  setOpenModalUpdate: (value: boolean) => void;
  dataUpdate: ICategory | null;
  setDataUpdate: (value: ICategory | null) => void;
  refreshTable: () => void;
}

type FieldType = {
  name: string;
  description?: string;
};

const UpdateCategory = ({
  openModalUpdate,
  setOpenModalUpdate,
  dataUpdate,
  setDataUpdate,
  refreshTable,
}: IProps) => {
  const [form] = Form.useForm<FieldType>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { message, notification } = App.useApp();

  useEffect(() => {
    if (!dataUpdate || !openModalUpdate) {
      return;
    }

    form.setFieldsValue({
      name: dataUpdate.name,
      description: dataUpdate.description || '',
    });
  }, [dataUpdate, form, openModalUpdate]);

  const handleCloseModal = () => {
    form.resetFields();
    setDataUpdate(null);
    setOpenModalUpdate(false);
  };

  const getErrorMessage = (errorMessage: string | string[] | undefined) => {
    if (Array.isArray(errorMessage)) {
      return errorMessage[0];
    }

    return errorMessage || 'Có lỗi xảy ra, vui lòng thử lại.';
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    if (!dataUpdate?._id) {
      notification.error({
        message: 'Không thể cập nhật danh mục',
        description: 'Không tìm thấy ID danh mục cần cập nhật.',
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateCategoryAPI(dataUpdate._id, {
        name: values.name.trim(),
        description: values.description?.trim() || '',
      });

      if (res?.data) {
        message.success('Cập nhật danh mục thành công!');

        handleCloseModal();
        refreshTable();
        return;
      }

      notification.error({
        message: 'Không thể cập nhật danh mục',
        description: getErrorMessage(res?.error?.message),
      });
    } catch (error) {
      console.error('Update category error:', error);

      notification.error({
        message: 'Không thể cập nhật danh mục',
        description: 'Có lỗi xảy ra khi cập nhật danh mục.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Cập nhật danh mục"
      open={openModalUpdate}
      onOk={() => form.submit()}
      onCancel={handleCloseModal}
      okText="Cập nhật"
      cancelText="Hủy"
      confirmLoading={isSubmitting}
      maskClosable={false}
      destroyOnClose
      centered
    >
      <Form
        form={form}
        layout="vertical"
        name="update-category-form"
        onFinish={onFinish}
        autoComplete="off"
        style={{
          marginTop: 20,
        }}
      >
        <Form.Item<FieldType>
          label="Tên danh mục"
          name="name"
          rules={[
            {
              required: true,
              message: 'Vui lòng nhập tên danh mục!',
            },
            {
              whitespace: true,
              message: 'Tên danh mục không được chỉ chứa khoảng trắng!',
            },
            {
              max: 100,
              message: 'Tên danh mục không được vượt quá 100 ký tự!',
            },
          ]}
        >
          <Input placeholder="Nhập tên danh mục" maxLength={100} showCount />
        </Form.Item>

        <Form.Item<FieldType>
          label="Mô tả"
          name="description"
          rules={[
            {
              max: 500,
              message: 'Mô tả không được vượt quá 500 ký tự!',
            },
          ]}
        >
          <Input.TextArea rows={4} placeholder="Nhập mô tả danh mục" maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateCategory;
