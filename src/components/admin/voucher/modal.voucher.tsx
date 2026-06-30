import { createVoucherAPI, updateVoucherAPI } from '@/services/api';
import { App, Form, Input, Modal, Select, InputNumber, Switch, DatePicker } from 'antd';
import type { FormProps } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

interface IProps {
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
  refreshTable: () => void;
  dataUpdate: any | null;
  setDataUpdate: (value: any | null) => void;
}

type FieldType = {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  usageLimit?: number;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  isActive: boolean;
};

const VoucherModal = ({ openModal, setOpenModal, refreshTable, dataUpdate, setDataUpdate }: IProps) => {
  const [form] = Form.useForm<FieldType>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const discountType = Form.useWatch('discountType', form);

  const { message, notification } = App.useApp();

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        code: dataUpdate.code,
        discountType: dataUpdate.discountType,
        discountValue: dataUpdate.discountValue,
        maxDiscountValue: dataUpdate.maxDiscountValue,
        minOrderValue: dataUpdate.minOrderValue,
        usageLimit: dataUpdate.usageLimit,
        isActive: dataUpdate.isActive,
        dateRange: dataUpdate.startDate && dataUpdate.endDate 
          ? [dayjs(dataUpdate.startDate), dayjs(dataUpdate.endDate)]
          : null,
      });
    } else {
      form.setFieldsValue({
        discountType: 'FIXED',
        discountValue: 0,
        minOrderValue: 0,
        usageLimit: 0,
        isActive: true,
        dateRange: null,
      });
    }
  }, [dataUpdate, openModal]);

  const handleCloseModal = () => {
    form.resetFields();
    setDataUpdate(null);
    setOpenModal(false);
  };

  const getErrorMessage = (errorMessage: string | string[] | undefined) => {
    if (Array.isArray(errorMessage)) {
      return errorMessage[0];
    }
    return errorMessage || 'Có lỗi xảy ra, vui lòng thử lại.';
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setIsSubmitting(true);
    const startDate = values.dateRange ? values.dateRange[0].toISOString() : undefined;
    const endDate = values.dateRange ? values.dateRange[1].toISOString() : undefined;

    const payload = {
      code: values.code.trim().toUpperCase(),
      discountType: values.discountType,
      discountValue: values.discountValue,
      maxDiscountValue: values.discountType === 'PERCENTAGE' ? values.maxDiscountValue : undefined,
      minOrderValue: values.minOrderValue || 0,
      usageLimit: values.usageLimit || 0,
      startDate,
      endDate,
      isActive: values.isActive,
    };

    try {
      let res;
      if (dataUpdate) {
        res = await updateVoucherAPI(dataUpdate._id, payload);
      } else {
        res = await createVoucherAPI(payload);
      }

      if (res?.data) {
        message.success(dataUpdate ? 'Cập nhật voucher thành công!' : 'Tạo mới voucher thành công!');
        handleCloseModal();
        refreshTable();
        return;
      }

      notification.error({
        message: dataUpdate ? 'Không thể cập nhật voucher' : 'Không thể tạo voucher',
        description: getErrorMessage(res?.error?.message),
      });
    } catch (error: any) {
      console.error('Voucher submit error:', error);
      notification.error({
        message: dataUpdate ? 'Không thể cập nhật voucher' : 'Không thể tạo voucher',
        description: getErrorMessage(error?.response?.data?.message || 'Có lỗi xảy ra.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={dataUpdate ? 'Cập nhật mã giảm giá' : 'Thêm mới mã giảm giá'}
      open={openModal}
      onOk={() => form.submit()}
      onCancel={handleCloseModal}
      okText={dataUpdate ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Hủy"
      confirmLoading={isSubmitting}
      maskClosable={false}
      destroyOnClose
      centered
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        name="voucher-form"
        onFinish={onFinish}
        autoComplete="off"
        style={{ marginTop: 20 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item<FieldType>
            label="Mã giảm giá (Code)"
            name="code"
            rules={[
              { required: true, message: 'Vui lòng nhập mã giảm giá!' },
              { whitespace: true, message: 'Mã không được chỉ chứa khoảng trắng!' },
            ]}
          >
            <Input placeholder="Ví dụ: SALE50K" style={{ textTransform: 'uppercase' }} disabled={!!dataUpdate} />
          </Form.Item>

          <Form.Item<FieldType>
            label="Loại giảm giá"
            name="discountType"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'Giảm số tiền cụ thể (đ)', value: 'FIXED' },
                { label: 'Giảm theo phần trăm (%)', value: 'PERCENTAGE' },
              ]}
            />
          </Form.Item>

          <Form.Item<FieldType>
            label="Giá trị giảm giá"
            name="discountValue"
            rules={[
              { required: true, message: 'Vui lòng nhập giá trị giảm giá!' },
              { type: 'number', min: 0, message: 'Giá trị không được âm!' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder={discountType === 'PERCENTAGE' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50000 (đ)'}
              formatter={(value) => discountType === 'FIXED' ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : `${value}`}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          {discountType === 'PERCENTAGE' && (
            <Form.Item<FieldType>
              label="Số tiền giảm tối đa (đ)"
              name="maxDiscountValue"
              rules={[{ type: 'number', min: 0, message: 'Giá trị không được âm!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Ví dụ: 50000 (đ)"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          )}

          <Form.Item<FieldType>
            label="Đơn hàng tối thiểu (đ)"
            name="minOrderValue"
            rules={[{ type: 'number', min: 0, message: 'Giá trị không được âm!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Ví dụ: 150000 (đ)"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item<FieldType>
            label="Giới hạn lượt dùng (0 = Không giới hạn)"
            name="usageLimit"
            rules={[{ type: 'number', min: 0, message: 'Giá trị không được âm!' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Ví dụ: 100" />
          </Form.Item>

          <Form.Item<FieldType>
            label="Thời gian hiệu lực"
            name="dateRange"
            style={{ gridColumn: 'span 2' }}
          >
            <DatePicker.RangePicker
              showTime
              format="DD-MM-YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder={['Ngày bắt đầu', 'Ngày hết hạn']}
            />
          </Form.Item>

          <Form.Item<FieldType>
            label="Kích hoạt sử dụng"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default VoucherModal;
