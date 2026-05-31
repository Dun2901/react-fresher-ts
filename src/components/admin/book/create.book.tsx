import {
  createBookAPI,
  deleteUploadedFileAPI,
  getCategoriesAPI,
  uploadMultipleFileAPI,
} from '@/services/api';
import { PlusOutlined } from '@ant-design/icons';
import { App, Divider, Form, Input, InputNumber, Modal, Select, Upload } from 'antd';
import type { FormProps, UploadFile, UploadProps } from 'antd';
import { useEffect, useState } from 'react';

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

type TCategoryOption = {
  label: string;
  value: string;
};

const CreateBook = (props: IProps) => {
  const { openModalCreate, setOpenModalCreate, refreshTable } = props;

  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [categories, setCategories] = useState<TCategoryOption[]>([]);
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);
  const [sliderFileList, setSliderFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm();
  const { message, notification } = App.useApp();

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await getCategoriesAPI('current=1&pageSize=100');

      const result = Array.isArray(res.data) ? res.data : res.data?.result || [];

      const options = result.map((item: ICategory) => ({
        label: item.name,
        value: item._id,
      }));

      setCategories(options);
    };

    if (openModalCreate) {
      fetchCategories();
    }
  }, [openModalCreate]);

  const handleCancel = () => {
    setOpenModalCreate(false);
    form.resetFields();
    setThumbnailFileList([]);
    setSliderFileList([]);
  };

  const getNewFiles = (fileList: UploadFile[]) => {
    return fileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File);
  };

  const clearUploadedFiles = async (fileNames: string[]) => {
    const validFileNames = fileNames.filter(Boolean);

    if (!validFileNames.length) return;

    await Promise.allSettled(validFileNames.map((fileName) => deleteUploadedFileAPI(fileName)));
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const { mainText, author, price, quantity, category } = values;

    if (!thumbnailFileList.length) {
      notification.error({
        message: 'Thiếu ảnh thumbnail',
        description: 'Vui lòng chọn ảnh thumbnail cho sách.',
      });
      return;
    }

    const isValidCategory = categories.some((item) => item.value === category);

    if (!isValidCategory) {
      notification.error({
        message: 'Thể loại không hợp lệ',
        description: 'Vui lòng chọn thể loại trong danh sách.',
      });
      return;
    }

    setIsSubmit(true);

    const uploadedFiles: string[] = [];

    try {
      const thumbnailFiles = getNewFiles(thumbnailFileList);
      const sliderFiles = getNewFiles(sliderFileList);

      let thumbnail = '';
      let slider: string[] = [];

      if (thumbnailFiles.length > 0) {
        const resThumbnail = await uploadMultipleFileAPI(thumbnailFiles);

        thumbnail = resThumbnail.data?.fileUploaded?.[0] || '';

        if (thumbnail) {
          uploadedFiles.push(thumbnail);
        }
      }

      if (sliderFiles.length > 0) {
        const resSlider = await uploadMultipleFileAPI(sliderFiles);

        slider = resSlider.data?.fileUploaded || [];

        uploadedFiles.push(...slider);
      }

      const res = await createBookAPI({
        mainText,
        author,
        price: Number(price),
        quantity: Number(quantity),
        category,
        thumbnail,
        slider,
      });

      if (res && res.data) {
        message.success('Tạo mới sách thành công.');
        handleCancel();
        refreshTable();
      } else {
        await clearUploadedFiles(uploadedFiles);

        notification.error({
          message: 'Đã có lỗi xảy ra!',
          description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
        });
      }
    } catch (error) {
      await clearUploadedFiles(uploadedFiles);

      notification.error({
        message: 'Đã có lỗi xảy ra!',
        description: 'Không thể tạo sách hoặc upload ảnh thất bại.',
      });
    }

    setIsSubmit(false);
  };

  const thumbnailUploadProps: UploadProps = {
    listType: 'picture-card',
    maxCount: 1,
    fileList: thumbnailFileList,
    beforeUpload: () => false,
    onChange: ({ fileList }) => {
      setThumbnailFileList(fileList);
    },
  };

  const sliderUploadProps: UploadProps = {
    listType: 'picture-card',
    multiple: true,
    fileList: sliderFileList,
    beforeUpload: () => false,
    onChange: ({ fileList }) => {
      setSliderFileList(fileList);
    },
  };

  return (
    <Modal
      title="Thêm mới sách"
      open={openModalCreate}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      maskClosable={false}
      centered
      width={800}
      okText="Tạo mới"
      cancelText="Hủy"
      confirmLoading={isSubmit}
    >
      <Divider />

      <Form
        form={form}
        name="form-create-book"
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          label="Tên sách"
          name="mainText"
          rules={[{ required: true, message: 'Tên sách không được để trống!' }]}
        >
          <Input placeholder="Nhập tên sách" />
        </Form.Item>

        <Form.Item<FieldType>
          label="Tác giả"
          name="author"
          rules={[{ required: true, message: 'Tác giả không được để trống!' }]}
        >
          <Input placeholder="Nhập tác giả" />
        </Form.Item>

        <Form.Item<FieldType>
          label="Thể loại"
          name="category"
          rules={[{ required: true, message: 'Vui lòng chọn thể loại!' }]}
        >
          <Select
            placeholder="Chọn thể loại"
            options={categories}
            showSearch
            optionFilterProp="label"
            loading={!categories.length}
            notFoundContent="Không có thể loại"
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Giá"
          name="price"
          rules={[{ required: true, message: 'Giá không được để trống!' }]}
        >
          <InputNumber<number>
            min={0}
            style={{ width: '100%' }}
            placeholder="Nhập giá"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Số lượng"
          name="quantity"
          rules={[{ required: true, message: 'Số lượng không được để trống!' }]}
        >
          <InputNumber<number> min={0} style={{ width: '100%' }} placeholder="Nhập số lượng" />
        </Form.Item>

        <Form.Item label="Thumbnail" required>
          <Upload {...thumbnailUploadProps}>
            {thumbnailFileList.length >= 1 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item label="Slider">
          <Upload {...sliderUploadProps}>
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBook;
