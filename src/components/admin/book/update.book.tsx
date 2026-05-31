import { getCategoriesAPI, updateBookAPI, uploadMultipleFileAPI } from '@/services/api';
import { PlusOutlined } from '@ant-design/icons';
import { App, Divider, Form, Input, InputNumber, Modal, Select, Upload } from 'antd';
import type { FormProps, UploadFile, UploadProps } from 'antd';
import { useEffect, useState } from 'react';

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

type TCategoryOption = {
  label: string;
  value: string;
};

const getImageUrl = (image?: string) => {
  if (!image) return '';

  if (image.startsWith('http')) {
    return image;
  }

  return `${import.meta.env.VITE_BACKEND_URL}/images/book/${image}`;
};

const getFileNameFromUrl = (url?: string) => {
  if (!url) return '';

  return url.split('/').pop() || url;
};

const getOldFileName = (file: UploadFile) => {
  return file.name || getFileNameFromUrl(file.url);
};

const getNewFiles = (fileList: UploadFile[]) => {
  return fileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File);
};

const UpdateBook = (props: IProps) => {
  const { openModalUpdate, setOpenModalUpdate, dataUpdate, setDataUpdate, refreshTable } = props;

  const [form] = Form.useForm();

  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  const [categories, setCategories] = useState<TCategoryOption[]>([]);
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);
  const [sliderFileList, setSliderFileList] = useState<UploadFile[]>([]);

  const { message, notification } = App.useApp();

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await getCategoriesAPI('current=1&pageSize=100');

      if (res.data?.result) {
        const options = res.data.result.map((item: ICategory) => ({
          label: item.name,
          value: item._id,
        }));

        setCategories(options);
      }
    };

    if (openModalUpdate) {
      fetchCategories();
    }
  }, [openModalUpdate]);

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        _id: dataUpdate._id,
        mainText: dataUpdate.mainText,
        author: dataUpdate.author,
        price: dataUpdate.price,
        quantity: dataUpdate.quantity,
        category:
          typeof dataUpdate.category === 'object' ? dataUpdate.category?._id : dataUpdate.category,
      });

      if (dataUpdate.thumbnail) {
        setThumbnailFileList([
          {
            uid: '-1',
            name: dataUpdate.thumbnail,
            status: 'done',
            url: getImageUrl(dataUpdate.thumbnail),
          },
        ]);
      } else {
        setThumbnailFileList([]);
      }

      if (dataUpdate.slider?.length) {
        setSliderFileList(
          dataUpdate.slider.map((image, index) => ({
            uid: `-${index + 1}`,
            name: image,
            status: 'done',
            url: getImageUrl(image),
          })),
        );
      } else {
        setSliderFileList([]);
      }
    }
  }, [dataUpdate, form]);

  const handleCancel = () => {
    setOpenModalUpdate(false);
    setDataUpdate(null);
    form.resetFields();
    setThumbnailFileList([]);
    setSliderFileList([]);
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const { _id, mainText, author, price, quantity, category } = values;

    if (!thumbnailFileList.length) {
      notification.error({
        message: 'Thiếu ảnh thumbnail',
        description: 'Vui lòng chọn ảnh thumbnail cho sách.',
      });
      return;
    }

    setIsSubmit(true);

    try {
      let thumbnail = getOldFileName(thumbnailFileList[0]);

      const newThumbnailFiles = getNewFiles(thumbnailFileList);

      if (newThumbnailFiles.length > 0) {
        const resThumbnail = await uploadMultipleFileAPI(newThumbnailFiles);

        thumbnail = resThumbnail.data?.fileUploaded?.[0] || '';
      }

      const oldSliderImages = sliderFileList
        .filter((file) => !file.originFileObj)
        .map((file) => getOldFileName(file))
        .filter(Boolean);

      const newSliderFiles = getNewFiles(sliderFileList);

      let newSliderImages: string[] = [];

      if (newSliderFiles.length > 0) {
        const resSlider = await uploadMultipleFileAPI(newSliderFiles);

        newSliderImages = resSlider.data?.fileUploaded || [];
      }

      const slider = [...oldSliderImages, ...newSliderImages];

      const res = await updateBookAPI(_id, {
        mainText,
        author,
        price: Number(price),
        quantity: Number(quantity),
        category,
        thumbnail,
        slider,
      });

      if (res && res.data) {
        message.success('Cập nhật sách thành công.');
        handleCancel();
        refreshTable();
      } else {
        notification.error({
          message: 'Đã có lỗi xảy ra!',
          description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
        });
      }
    } catch (error) {
      notification.error({
        message: 'Upload ảnh thất bại',
        description: 'Vui lòng kiểm tra lại API upload-multiple.',
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
      title="Cập nhật sách"
      open={openModalUpdate}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      maskClosable={false}
      centered
      width={800}
      okText="Cập nhật"
      cancelText="Hủy"
      confirmLoading={isSubmit}
    >
      <Divider />

      <Form
        form={form}
        name="form-update-book"
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item<FieldType> name="_id" hidden>
          <Input />
        </Form.Item>

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
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Giá"
          name="price"
          rules={[{ required: true, message: 'Giá không được để trống!' }]}
        >
          <InputNumber<number>
            min={0 as number}
            style={{ width: '100%' }}
            placeholder="Nhập giá"
            formatter={(value) => (value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || '0')}
          />
        </Form.Item>

        <Form.Item<FieldType>
          label="Số lượng"
          name="quantity"
          rules={[{ required: true, message: 'Số lượng không được để trống!' }]}
        >
          <InputNumber<number>
            min={0 as number}
            style={{ width: '100%' }}
            placeholder="Nhập số lượng"
          />
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

export default UpdateBook;
