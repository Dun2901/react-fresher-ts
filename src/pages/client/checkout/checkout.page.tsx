import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  message,
  notification,
  Radio,
  Result,
  Row,
  Spin,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  PhoneOutlined,
  UserOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCurrentApp } from 'components/context/app.context.tsx';
import { checkoutAPI, createVnpayPaymentUrlAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import vnpayLogo from '@/assets/img/vnpay.png';
import './checkout.page.scss';

const { TextArea } = Input;

interface IOrderFormValues {
  fullName: string;
  phone: string;
  address: string;
  paymentMethod: 'COD' | 'ONLINE';
  note?: string;
}

type CheckoutLocationState = {
  selectedBookIds?: string[];
} | null;

const getSelectedBookIdsFromStorage = () => {
  try {
    const rawSelectedBookIds = sessionStorage.getItem('checkout_selected_book_ids');

    if (!rawSelectedBookIds) {
      return [];
    }

    const parsedSelectedBookIds = JSON.parse(rawSelectedBookIds);

    return Array.isArray(parsedSelectedBookIds) ? parsedSelectedBookIds : [];
  } catch {
    return [];
  }
};

const CheckoutPage: React.FC = () => {
  const { user, carts, setCarts } = useCurrentApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [form] = Form.useForm<IOrderFormValues>();

  const locationState = location.state as CheckoutLocationState;

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<IOrder | null>(null);
  const [selectedBookIds] = useState<string[]>(() => {
    if (locationState?.selectedBookIds?.length) {
      return locationState.selectedBookIds;
    }

    return getSelectedBookIdsFromStorage();
  });

  const hasSelectedBookIds = selectedBookIds.length > 0;

  const selectedBookIdSet = useMemo(() => {
    return new Set(selectedBookIds);
  }, [selectedBookIds]);

  const checkoutItems = useMemo(() => {
    if (!hasSelectedBookIds) {
      return carts;
    }

    return carts.filter((item) => selectedBookIdSet.has(item.bookId._id));
  }, [carts, hasSelectedBookIds, selectedBookIdSet]);

  const totalItems = useMemo(() => {
    return checkoutItems.reduce((total, item) => total + item.quantity, 0);
  }, [checkoutItems]);

  const totalPrice = useMemo(() => {
    return checkoutItems.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  }, [checkoutItems]);

  const stockWarningItems = useMemo(() => {
    return checkoutItems.filter(
      (item) => item.quantity > item.bookId.quantity || item.bookId.quantity <= 0,
    );
  }, [checkoutItems]);

  const hasStockWarning = stockWarningItems.length > 0;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      paymentMethod: 'COD',
    });
  }, [form, user]);

  const getCheckoutErrorMessage = (error: any) => {
    const responseMessage = error?.response?.data?.message || error?.response?.data?.error?.message;

    if (Array.isArray(responseMessage)) {
      return responseMessage[0] || 'Đã xảy ra lỗi!';
    }

    return responseMessage || error?.message || 'Đã xảy ra lỗi!';
  };

  const onFinishOrder = async (values: IOrderFormValues) => {
    if (checkoutItems.length === 0) {
      notification.warning({
        message: 'Không thể đặt hàng',
        description: 'Vui lòng quay lại giỏ hàng và chọn sản phẩm cần mua.',
        placement: 'topRight',
      });
      return;
    }

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
      selectedBookIds: hasSelectedBookIds ? selectedBookIds : undefined,
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

      if (hasSelectedBookIds) {
        setCarts((prev) => prev.filter((item) => !selectedBookIdSet.has(item.bookId._id)));
      } else {
        setCarts([]);
      }

      sessionStorage.removeItem('checkout_selected_book_ids');
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
      <div className="checkout-status-page">
        <div className="checkout-status-card">
          <Spin indicator={<LoadingOutlined className="checkout-status-card__loading" spin />} />

          <Result
            status="info"
            title="Đang chuyển sang cổng thanh toán VNPay"
            subTitle="Vui lòng không tắt trình duyệt hoặc quay lại trong lúc hệ thống đang chuyển hướng."
          />
        </div>
      </div>
    );
  }

  if (isSuccess && createdOrder) {
    const isCodOrder = createdOrder.paymentMethod === 'COD';

    return (
      <div className="checkout-status-page">
        <div className="checkout-success-card">
          <Result
            status="success"
            title="Đặt hàng thành công!"
            subTitle="Cảm ơn bạn đã mua sắm. Đơn hàng đã được ghi nhận thành công."
            extra={[
              <Button type="primary" key="book" onClick={() => navigate('/book')}>
                Tiếp tục mua sắm
              </Button>,
              <Button key="orders" onClick={() => navigate('/orders')}>
                Xem đơn hàng
              </Button>,
            ]}
          />

          <div className="success-order-box">
            <div className="success-order-row">
              <span>Mã đơn hàng</span>
              <b>{createdOrder.orderCode}</b>
            </div>

            <div className="success-order-row">
              <span>Người nhận</span>
              <b>{createdOrder.shippingAddress.fullName}</b>
            </div>

            <div className="success-order-row">
              <span>Thanh toán</span>
              <b>{isCodOrder ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}</b>
            </div>

            <div className="success-order-row success-order-row--total">
              <span>{isCodOrder ? 'Cần trả khi nhận hàng' : 'Tổng tiền đơn hàng'}</span>
              <b>{formatCurrency(createdOrder.totalPrice)}</b>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (carts.length === 0 || checkoutItems.length === 0) {
    return (
      <div className="checkout-status-page">
        <div className="checkout-empty-card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="checkout-empty-text">
                <h3>Chưa có sản phẩm để đặt hàng</h3>
                <p>Vui lòng quay lại giỏ hàng và chọn sản phẩm cần mua.</p>
              </div>
            }
          />

          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/cart')}>
            Quay lại giỏ hàng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button type="button" className="checkout-header__back" onClick={() => navigate('/cart')}>
          <ArrowLeftOutlined />
          <span>Quay lại giỏ hàng</span>
        </button>

        <div className="checkout-header__content">
          <h2>Thông tin đặt hàng</h2>
          <p>Kiểm tra thông tin nhận hàng và phương thức thanh toán trước khi xác nhận.</p>
        </div>
      </div>

      {hasStockWarning && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="checkout-stock-alert"
          message="Một số sản phẩm đã vượt quá số lượng tồn kho"
          description={
            <div className="checkout-stock-alert__content">
              {stockWarningItems.map((item) => (
                <div key={item.bookId._id}>
                  <b>{item.bookId.mainText}</b>: đang chọn {item.quantity}, kho hiện còn{' '}
                  {item.bookId.quantity}
                </div>
              ))}

              <Button
                type="link"
                className="checkout-stock-alert__link"
                onClick={() => navigate('/cart')}
              >
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
        className="checkout-form"
      >
        <Row gutter={[20, 20]} className="checkout-main-row">
          <Col xs={24} lg={15}>
            <div className="checkout-left-column">
              <Card
                className="checkout-card"
                title={
                  <div className="checkout-card-title">
                    <EnvironmentOutlined />
                    <span>Thông tin nhận hàng</span>
                  </div>
                }
              >
                <Row gutter={[14, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Người nhận"
                      name="fullName"
                      rules={[{ required: true, message: 'Họ tên không được để trống!' }]}
                    >
                      <Input
                        prefix={<UserOutlined />}
                        placeholder="Nhập đầy đủ họ và tên"
                        size="large"
                      />
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
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="Nhập số điện thoại"
                        size="large"
                      />
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
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
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
                className="checkout-card"
                title={
                  <div className="checkout-card-title">
                    <CreditCardOutlined />
                    <span>Phương thức thanh toán</span>
                  </div>
                }
              >
                <Form.Item name="paymentMethod" noStyle>
                  <Radio.Group className="payment-method-group">
                    <label className="payment-option">
                      <Radio value="COD" />

                      <div className="payment-option__icon payment-option__icon--cod">
                        <WalletOutlined />
                      </div>

                      <div className="payment-option__content">
                        <div className="payment-option__title">Thanh toán khi nhận hàng</div>
                        <p>Trả tiền mặt trực tiếp khi nhận được sách.</p>
                      </div>
                    </label>

                    <label className="payment-option">
                      <Radio value="ONLINE" />

                      <div className="payment-option__icon payment-option__icon--vnpay">
                        <img src={vnpayLogo} alt="VNPay" />
                      </div>

                      <div className="payment-option__content">
                        <div className="payment-option__title">Thanh toán qua VNPay</div>
                        <p>Quét mã QR bằng Mobile Banking, ví điện tử hoặc thẻ ATM.</p>
                      </div>
                    </label>
                  </Radio.Group>
                </Form.Item>
              </Card>
            </div>
          </Col>

          <Col xs={24} lg={9}>
            <Card title="Chi tiết đơn hàng" className="checkout-summary-card">
              <div className="checkout-cart-list">
                {checkoutItems.map((item) => {
                  const isOverStock =
                    item.quantity > item.bookId.quantity || item.bookId.quantity <= 0;

                  return (
                    <div key={item.bookId._id} className="checkout-cart-item">
                      <div className="checkout-cart-item__image">
                        <img
                          src={getBookImageUrl(item.bookId.thumbnail)}
                          alt={item.bookId.mainText}
                        />
                      </div>

                      <div className="checkout-cart-item__info">
                        <h4>{item.bookId.mainText}</h4>

                        <div className="checkout-cart-item__meta">
                          <span>Số lượng: {item.quantity}</span>
                          {isOverStock && <Tag color="warning">Cần cập nhật</Tag>}
                        </div>
                      </div>

                      <div className="checkout-cart-item__price">
                        {formatCurrency(item.quantity * item.priceAtAdd)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Divider className="checkout-summary-divider" />

              <div className="checkout-price-row">
                <span>Số sản phẩm</span>
                <b>{checkoutItems.length}</b>
              </div>

              <div className="checkout-price-row">
                <span>Tổng số lượng</span>
                <b>{totalItems}</b>
              </div>

              <div className="checkout-price-row">
                <span>Tạm tính</span>
                <b>{formatCurrency(totalPrice)}</b>
              </div>

              <div className="checkout-price-row">
                <span>Phí vận chuyển</span>
                <b className="checkout-free-text">Miễn phí</b>
              </div>

              <Divider className="checkout-summary-divider" />

              <div className="checkout-total-row">
                <span>Tổng cần trả</span>
                <b>{formatCurrency(totalPrice)}</b>
              </div>

              <Button
                type="primary"
                size="large"
                htmlType="submit"
                block
                loading={loading}
                disabled={hasStockWarning || isRedirectingPayment}
                className="checkout-submit-btn"
              >
                Xác nhận đặt hàng
              </Button>
            </Card>
          </Col>
        </Row>

        <div className="mobile-checkout-bar">
          <div className="mobile-checkout-bar__price">
            <span>Tổng cần trả</span>
            <b>{formatCurrency(totalPrice)}</b>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={hasStockWarning || isRedirectingPayment}
            className="mobile-checkout-bar__btn"
          >
            Đặt hàng
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CheckoutPage;
