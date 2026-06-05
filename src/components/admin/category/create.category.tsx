import { createCategoryAPI } from '@/services/api';
import { App, Form, Input, Modal } from 'antd';
import type { FormProps } from 'antd';
import { useState } from 'react';

interface IProps {
  openModalCreate: boolean;
  setOpenModalCreate: (value: boolean) => void;
  refreshTable: () => void;
}

type FieldType = {
  name: string;
  description?: string;
};

const CreateCategory = ({ openModalCreate, setOpenModalCreate, refreshTable }: IProps) => {
  const [form] = Form.useForm<FieldType>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { message, notification } = App.useApp();

  const handleCloseModal = () => {
    form.resetFields();
    setOpenModalCreate(false);
  };

  const getErrorMessage = (errorMessage: string | string[] | undefined) => {
    if (Array.isArray(errorMessage)) {
      return errorMessage[0];
    }

    return errorMessage || 'Có lỗi xảy ra, vui lòng thử lại.';
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setIsSubmitting(true);

    try {
      const res = await createCategoryAPI({
        name: values.name.trim(),
        description: values.description?.trim() || '',
      });

      if (res?.data) {
        message.success('Tạo danh mục thành công!');

        handleCloseModal();
        refreshTable();
        return;
      }

      notification.error({
        message: 'Không thể tạo danh mục',
        description: getErrorMessage(res?.error?.message),
      });
    } catch (error) {
      console.error('Create category error:', error);

      notification.error({
        message: 'Không thể tạo danh mục',
        description: 'Có lỗi xảy ra khi tạo danh mục.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm mới danh mục"
      open={openModalCreate}
      onOk={() => form.submit()}
      onCancel={handleCloseModal}
      okText="Tạo mới"
      cancelText="Hủy"
      confirmLoading={isSubmitting}
      maskClosable={false}
      destroyOnClose
      centered
    >
      <Form
        form={form}
        layout="vertical"
        name="create-category-form"
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

export default CreateCategory;
