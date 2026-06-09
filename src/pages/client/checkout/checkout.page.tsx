import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  notification,
  Radio,
  Result,
  Row,
  Space,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, CreditCardOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { useCurrentApp } from 'components/context/app.context.tsx';
import { checkoutAPI, createVnpayPaymentUrlAPI } from '@/services/api';
import { formatCurrency } from '@/services/helper';
import vnpayLogo from '@/assets/img/vnpay.png';
import './checkout.page.scss';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface IOrderFormValues {
  fullName: string;
  phone: string;
  address: string;
  paymentMethod: 'COD' | 'ONLINE';
  note?: string;
}

const CheckoutPage: React.FC = () => {
  const { carts, setCarts } = useCurrentApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<IOrder | null>(null);

  const stockWarningItems = useMemo(() => {
    return carts.filter((item) => item.quantity > item.bookId.quantity);
  }, [carts]);

  const hasStockWarning = stockWarningItems.length > 0;

  const calculateTotalPrice = () => {
    return carts.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  };

  const getCheckoutErrorMessage = (error: any) => {
    const responseMessage = error?.response?.data?.message || error?.response?.data?.error?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage[0] || 'Đã xảy ra lỗi!';
    }

    return responseMessage || error?.message || 'Đã xảy ra lỗi!';
  };

  const onFinishOrder = async (values: IOrderFormValues) => {
    if (hasStockWarning) {
      notification.warning({
        message: 'Không thể đặt hàng',
        description: 'Vui lòng quay lại giỏ hàng và cập nhật số lượng theo tồn kho hiện tại.',
        placement: 'topRight',
      });
      return;
    }

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
      const order = res?.data;

      if (!order) {
        throw new Error('Không nhận được thông tin đơn hàng');
      }

      if (values.paymentMethod === 'ONLINE' && order._id) {
        setIsRedirectingPayment(true);

        message.loading('Đang chuyển sang cổng thanh toán VNPay...', 2);

        const paymentRes = await createVnpayPaymentUrlAPI(order._id);
        const paymentUrl = paymentRes?.data?.paymentUrl;

        if (!paymentUrl) {
          throw new Error('Không nhận được URL thanh toán VNPay');
        }

        window.location.href = paymentUrl;
        return;
      }

      message.success(res.message || 'Đặt hàng thành công!');
      setCreatedOrder(order);
      setCarts([]);
      setIsSuccess(true);
    } catch (error: any) {
      setIsRedirectingPayment(false);

      notification.error({
        message: 'Đặt hàng thất bại',
        description: getCheckoutErrorMessage(error),
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isRedirectingPayment) {
    return (
      <div className="order-status-wrapper" style={{ padding: '80px 20px' }}>
        <Result
          status="info"
          title="Đang chuyển sang cổng thanh toán VNPay..."
          subTitle="Vui lòng không tắt trình duyệt hoặc quay lại trong lúc hệ thống đang chuyển hướng."
        />
      </div>
    );
  }

  if (isSuccess && createdOrder) {
    const isCodOrder = createdOrder.paymentMethod === 'COD';

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
              <Text>Cảm ơn bạn đã mua sắm. Đơn hàng đã được ghi nhận thành công.</Text>

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

                <div style={{ marginBottom: 4 }}>
                  Phương thức thanh toán:{' '}
                  <Text strong>
                    {isCodOrder ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}
                  </Text>
                </div>

                <div>
                  {isCodOrder ? 'Tổng tiền cần trả khi nhận hàng:' : 'Tổng tiền đơn hàng:'}{' '}
                  <Text strong type="danger">
                    {formatCurrency(createdOrder.totalPrice)}
                  </Text>
                </div>
              </Card>
            </Space>
          }
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </Button>,
            <Button key="history" onClick={() => navigate('/orders')}>
              Xem đơn hàng
            </Button>,
          ]}
        />
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="order-status-wrapper order-status-wrapper--empty-cart">
        <Result
          status="warning"
          title="Giỏ hàng của bạn đang trống"
          subTitle="Vui lòng chọn sản phẩm trước khi đặt hàng."
          extra={
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
              Quay lại trang chủ
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

      {hasStockWarning && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Một số sản phẩm đã vượt quá số lượng tồn kho"
          description={
            <div>
              {stockWarningItems.map((item) => (
                <div key={item.bookId._id}>
                  {item.bookId.mainText}: đang chọn {item.quantity}, còn kho {item.bookId.quantity}
                </div>
              ))}

              <Button type="link" style={{ paddingLeft: 0 }} onClick={() => navigate('/cart')}>
                Quay lại giỏ hàng để cập nhật
              </Button>
            </div>
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinishOrder}
        initialValues={{ paymentMethod: 'COD' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size="large" style={{ display: 'flex' }}>
              <Card
                title={
                  <span>
                    <EnvironmentOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    Thông tin nhận hàng
                  </span>
                }
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
                      <Input placeholder="Nhập số điện thoại" size="large" />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label="Địa chỉ nhận hàng"
                      name="address"
                      rules={[{ required: true, message: 'Vui lòng nhập địa chỉ cụ thể!' }]}
                    >
                      <TextArea
                        rows={3}
                        placeholder="Số nhà, tên đường, phường, quận, tỉnh..."
                        size="large"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item label="Ghi chú" name="note">
                      <TextArea rows={2} placeholder="Ghi chú thêm cho đơn hàng nếu có..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card
                title={
                  <span>
                    <CreditCardOutlined style={{ color: '#1677ff', marginRight: 8 }} />
                    Phương thức thanh toán
                  </span>
                }
              >
                <Form.Item name="paymentMethod" noStyle>
                  <Radio.Group className="payment-method-group">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Radio value="COD" className="payment-radio-item">
                        <Space direction="vertical" size={0} style={{ marginLeft: 8 }}>
                          <Text strong className="radio-label-text">
                            Thanh toán khi nhận hàng (COD)
                          </Text>

                          <Text type="secondary">Trả tiền mặt trực tiếp khi nhận hàng.</Text>
                        </Space>
                      </Radio>

                      <Divider style={{ margin: 0 }} />

                      <Radio value="ONLINE" className="payment-radio-item">
                        <div className="payment-content-wrapper">
                          <div className="payment-title-row">
                            <Text strong className="radio-label-text">
                              Thanh toán qua VNPay
                            </Text>

                            <img src={vnpayLogo} alt="VNPay" className="vnpay-logo" />
                          </div>

                          <Text type="secondary" className="payment-desc-text">
                            Quét mã QR bằng Mobile Banking, ví điện tử hoặc thẻ ATM.
                          </Text>
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
              </Card>
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Chi tiết đơn hàng" className="order-summary-card">
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

                        {item.quantity > item.bookId.quantity && (
                          <Text type="danger" style={{ fontSize: 12 }}>
                            Vượt tồn kho: còn {item.bookId.quantity}
                          </Text>
                        )}
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
                  Tổng cần trả:
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
                disabled={hasStockWarning || isRedirectingPayment}
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

export default CheckoutPage;
