import React, { useState } from 'react';
import {
  Row,
  Col,
  Button,
  Divider,
  Card,
  Form,
  Input,
  Radio,
  Space,
  Typography,
  message,
  Result,
  notification,
} from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useCurrentApp } from 'components/context/app.context.tsx';
import { useNavigate } from 'react-router-dom';
import { checkoutAPI, createVnpayPaymentUrlAPI } from '@/services/api';
import './orderPage.scss';
import vnpayLogo from '@/assets/img/vnpay.png';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface IOrderFormValues {
  fullName: string;
  phone: string;
  address: string;
  paymentMethod: 'COD' | 'ONLINE';
  note?: string;
}
const OrderPage: React.FC = () => {
  const { carts, setCarts } = useCurrentApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<IOrder | null>(null);

  const calculateTotalPrice = () => {
    return carts.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const onFinishOrder = async (values: IOrderFormValues) => {
    setLoading(true);

    const payload: ICheckoutDto = {
      shippingAddress: {
        fullName: values.fullName,
        phone: values.phone,
        address: values.address,
      },
      paymentMethod: values.paymentMethod,
      note: values.note,
    };
    try {
      const res = await checkoutAPI(payload);

      if (res && res.data) {
        if (values.paymentMethod === 'ONLINE' && res.data?._id) {
          message.loading('Đang kết nối và chuyển hướng sang cổng thanh toán VNPay...', 2);

          const paymentRes = await createVnpayPaymentUrlAPI(res.data._id);
          const paymentUrl = paymentRes.data?.paymentUrl;

          if (!paymentUrl) {
            throw new Error('Không nhận được URL thanh toán VNPay');
          }

          window.location.href = paymentUrl;
          return;
        }

        message.success(res.message || 'Đặt hàng thành công!');
        if (res.data) setCreatedOrder(res.data);
        setCarts([]);
        setIsSuccess(true);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Đã xảy ra lỗi trong quá trình xử lý đơn hàng!';

      notification.error({
        message: 'Đặt hàng thất bại',
        description: Array.isArray(errorMsg) ? errorMsg[0] : errorMsg,
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };
  // Giao diện thành công
  if (isSuccess && createdOrder) {
    return (
      <div
        className="order-status-wrapper"
        style={{ padding: '40px 20px', maxWidth: 650, margin: '0 auto' }}
      >
        <Result
          status="success"
          title="Đặt Hàng Thành Công!"
          subTitle={
            <Space direction="vertical" style={{ width: '100%', marginTop: 10 }}>
              <Text>
                Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đã được hệ thống ghi nhận thành công.
              </Text>
              {createdOrder && (
                <Card
                  size="small"
                  style={{ backgroundColor: '#fafafa', textAlign: 'left', marginTop: 15 }}
                >
                  <div style={{ marginBottom: 4 }}>
                    Mã đơn hàng:{' '}
                    <Text strong type="warning">
                      {createdOrder.orderCode}
                    </Text>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    Người nhận: <Text strong>{createdOrder.shippingAddress.fullName}</Text>
                  </div>
                  <div>
                    Tổng tiền cần trả (COD):{' '}
                    <Text strong type="danger">
                      {formatCurrency(createdOrder.totalPrice)}
                    </Text>
                  </div>
                </Card>
              )}
            </Space>
          }
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </Button>,
            <Button
              key="history"
              onClick={() => message.info('Tính năng xem lịch sử đơn hàng đang được phát triển!')}
            >
              Xem lịch sử đơn hàng
            </Button>,
          ]}
        />
      </div>
    );
  }

  // Giao diện giỏ hàng trống
  if (carts.length === 0) {
    return (
      <div className="order-status-wrapper order-status-wrapper--empty-cart">
        <Result
          status="warning"
          title="Giỏ hàng của bạn đang trống"
          subTitle="Vui lòng chọn sản phẩm vào giỏ trước khi tiến hành đặt hàng."
          extra={
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
              Quay lại trang chủ mua sắm
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="order-page-container">
      <div className="order-page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="back-btn"
        />
        <Title level={3} className="header-title">
          Thông tin đặt hàng
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinishOrder}
        initialValues={{ paymentMethod: 'COD' }}
      >
        <Row gutter={[24, 24]}>
          {/* CỘT BÊN TRÁI:  nhập thông tin và chọn thanhoán */}
          <Col xs={24} lg={14}>
            <Space direction="vertical" size="large" style={{ display: 'flex' }}>
              {/* địa chỉ giao hàng */}
              <Card
                title={
                  <span>
                    <EnvironmentOutlined style={{ color: '#ff4d4f', marginRight: 8 }} /> Thông tin
                    nhận hàng
                  </span>
                }
                bordered={true}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Họ và tên người nhận"
                      name="fullName"
                      rules={[{ required: true, message: 'Họ tên không được để trống!' }]}
                    >
                      <Input placeholder="Nhập đầy đủ họ và tên" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[
                        { required: true, message: 'Số điện thoại không được để trống!' },
                        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải đúng 10 chữ số!' },
                      ]}
                    >
                      <Input placeholder="Nhập số điện thoại di động" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Địa chỉ nhận hàng thực tế"
                      name="address"
                      rules={[{ required: true, message: 'Vui lòng cung cấp địa chỉ cụ thể!' }]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* phương thức thanh toán */}
              <Card
                title={
                  <span>
                    <CreditCardOutlined style={{ color: '#1677ff', marginRight: 8 }} /> Phương thức
                    thanh toán
                  </span>
                }
                bordered={true}
              >
                <Form.Item name="paymentMethod" noStyle>
                  <Radio.Group className="payment-method-group">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {/*COD */}
                      <Radio value="COD" className="payment-radio-item">
                        <Space direction="vertical" size={0} style={{ marginLeft: 8 }}>
                          <Text strong className="radio-label-text">
                            Thanh toán khi nhận hàng (COD)
                          </Text>
                          <Text type="secondary">
                            Nhận hàng thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.
                          </Text>
                        </Space>
                      </Radio>

                      <Divider style={{ margin: 0 }} />

                      {/*VNPay */}
                      <Radio value="ONLINE" className="payment-radio-item">
                        <div className="payment-content-wrapper">
                          <div className="payment-title-row">
                            <Text strong className="radio-label-text">
                              Thanh toán qua cổng VNPay
                            </Text>
                            <img src={vnpayLogo} alt="VNPay" className="vnpay-logo" />
                          </div>

                          <Text type="secondary" className="payment-desc-text">
                            Quét mã QR bằng ứng dụng Ngân hàng (Mobile Banking), ví điện tử hoặc thẻ
                            ATM/Quốc tế.
                          </Text>
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Card>
            </Space>
          </Col>

          {/*tóm tắt danh sách sản phẩm và tổng tiền */}
          <Col xs={24} lg={10}>
            <Card title="Chi tiết đơn hàng" className="order-summary-card">
              {/* list danh sách các cuốn sách */}
              <div className="cart-items-list">
                {carts.map((item) => (
                  <div key={item.bookId._id} className="cart-item">
                    <div className="cart-item__left">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${item.bookId.thumbnail}`}
                        alt={item.bookId.mainText}
                        className="book-img"
                      />
                      <div className="book-info">
                        <Text strong className="book-title">
                          {item.bookId.mainText}
                        </Text>
                        <Text type="secondary" className="book-qty">
                          Số lượng: {item.quantity}
                        </Text>
                      </div>
                    </div>
                    <div className="cart-item__right">
                      <Text strong className="item-total-price">
                        {formatCurrency(item.quantity * item.priceAtAdd)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div className="price-row">
                <Text className="price-label">Tạm tính:</Text>
                <Text className="price-value">{formatCurrency(calculateTotalPrice())}</Text>
              </div>
              <div className="price-row">
                <Text className="price-label">Phí vận chuyển:</Text>
                <Text type="success" strong>
                  Miễn phí
                </Text>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div className="final-total-row">
                <Text strong className="total-label">
                  Tổng số tiền cần trả:
                </Text>
                <Text strong className="total-amount">
                  {formatCurrency(calculateTotalPrice())}
                </Text>
              </div>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                block
                loading={loading}
                className="submit-order-btn"
              >
                Xác nhận đặt hàng
              </Button>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default OrderPage;
