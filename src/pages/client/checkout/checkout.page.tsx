import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
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
  Select,
  Spin,
  Tag,
  Modal,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  EnvironmentOutlined,
  LoadingOutlined,
  PhoneOutlined,
  RightOutlined,
  TagOutlined,
  UserOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCurrentApp } from 'components/context/app.context.tsx';
import {
  checkoutAPI,
  createVnpayPaymentUrlAPI,
  getProvincesAPI,
  getWardsByProvinceAPI,
  validateVoucherAPI,
  getClientVouchersAPI,
} from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import vnpayLogo from '@/assets/img/vnpay.png';
import './checkout.page.scss';
import { BackNavigationState, getBackFromState } from '@/utils/navigation';

const { TextArea } = Input;

interface IOrderFormValues {
  fullName: string;
  phone: string;

  provinceCode: string;
  provinceName: string;

  wardCode: string;
  wardName: string;

  addressLine: string;

  paymentMethod: 'COD' | 'ONLINE';
  note?: string;
}

interface IProvinceLocation {
  provinceCode: string;
  name: string;
  shortName: string;
  code: string;
  placeType: string;
}

interface IWardLocation {
  wardCode: string;
  name: string;
  provinceCode: string;
}

type CheckoutLocationState = BackNavigationState & {
  selectedBookIds?: string[];
};

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

const normalizeText = (value?: string | number | null) => {
  return String(value ?? '').trim();
};

const normalizePhone = (value?: string | number | null) => {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 10);
};

const CheckoutPage: React.FC = () => {
  const { user, carts, setCarts } = useCurrentApp();

  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as CheckoutLocationState;

  const [form] = Form.useForm<IOrderFormValues>();

  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRedirectingPayment, setIsRedirectingPayment] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<IOrder | null>(null);

  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState<boolean>(false);

  const [clientVouchers, setClientVouchers] = useState<any[]>([]);
  const [isModalVouchersOpen, setIsModalVouchersOpen] = useState<boolean>(false);
  const [isLoadingClientVouchers, setIsLoadingClientVouchers] = useState<boolean>(false);

  const fetchClientVouchers = async () => {
    setIsLoadingClientVouchers(true);
    try {
      const res = await getClientVouchersAPI();
      if (res?.data) {
        setClientVouchers(res.data);
      }
    } catch (err) {
      console.error('Fetch client vouchers error:', err);
    } finally {
      setIsLoadingClientVouchers(false);
    }
  };

  useEffect(() => {
    fetchClientVouchers();
  }, []);

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }
    setIsValidatingVoucher(true);
    setVoucherError(null);
    try {
      const res = await validateVoucherAPI(voucherCodeInput, totalPrice);
      if (res?.data?.isValid) {
        setAppliedVoucher({
          code: voucherCodeInput.trim().toUpperCase(),
          discount: res.data.discount,
        });
        message.success(res.message || 'Áp dụng mã giảm giá thành công!');
      } else {
        setVoucherError(res?.data?.message || 'Mã giảm giá không hợp lệ');
        setAppliedVoucher(null);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Lỗi xác thực mã giảm giá';
      setVoucherError(errorMsg);
      setAppliedVoucher(null);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError(null);
  };

  const [provinces, setProvinces] = useState<IProvinceLocation[]>([]);
  const [wards, setWards] = useState<IWardLocation[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState<boolean>(false);
  const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false);

  const selectedProvinceCode = Form.useWatch('provinceCode', form);
  const handleBackToCart = () => {
    navigate(getBackFromState(routeState) || '/cart');
  };

  const [selectedBookIds] = useState<string[]>(() => {
    if (routeState?.selectedBookIds?.length) {
      return routeState.selectedBookIds;
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

  const provinceOptions = useMemo(() => {
    return provinces.map((province) => ({
      label: province.name,
      value: province.provinceCode,
    }));
  }, [provinces]);

  const wardOptions = useMemo(() => {
    return wards.map((ward) => ({
      label: ward.name,
      value: ward.wardCode,
    }));
  }, [wards]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      fullName: normalizeText(user?.fullName),
      phone: normalizePhone(user?.phone),
      paymentMethod: 'COD',
    });
  }, [form, user]);

  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);

      try {
        const res = await getProvincesAPI();
        const data = (res as any)?.data || [];

        setProvinces(Array.isArray(data) ? data : []);
      } catch {
        notification.error({
          message: 'Không tải được tỉnh/thành phố',
          description: 'Vui lòng thử lại sau.',
          placement: 'topRight',
        });
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedProvinceCode) {
        setWards([]);
        return;
      }

      setIsLoadingWards(true);

      try {
        const res = await getWardsByProvinceAPI(selectedProvinceCode);
        const data = (res as any)?.data || [];

        setWards(Array.isArray(data) ? data : []);
      } catch {
        notification.error({
          message: 'Không tải được phường/xã',
          description: 'Vui lòng thử lại sau.',
          placement: 'topRight',
        });
      } finally {
        setIsLoadingWards(false);
      }
    };

    fetchWards();
  }, [selectedProvinceCode]);

  const handleProvinceChange = (provinceCode?: string) => {
    const selectedProvince = provinces.find((province) => province.provinceCode === provinceCode);

    form.setFieldsValue({
      provinceName: selectedProvince?.name,
      wardCode: undefined,
      wardName: undefined,
    });
  };

  const handleWardChange = (wardCode?: string) => {
    const selectedWard = wards.find((ward) => ward.wardCode === wardCode);

    form.setFieldValue('wardName', selectedWard?.name);
  };

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

    const addressLine = normalizeText(values.addressLine);
    const wardName = normalizeText(values.wardName);
    const provinceName = normalizeText(values.provinceName);

    const fullShippingAddress = [addressLine, wardName, provinceName].filter(Boolean).join(', ');

    setLoading(true);

    const payload: ICheckoutDto = {
      shippingAddress: {
        fullName: normalizeText(values.fullName),
        phone: normalizePhone(values.phone),
        address: fullShippingAddress,
      },
      paymentMethod: values.paymentMethod,
      note: normalizeText(values.note) || undefined,
      selectedBookIds: hasSelectedBookIds ? selectedBookIds : undefined,
      voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
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
              <Button
                type="primary"
                key="book"
                onClick={() => navigate('/book', { replace: true })}
              >
                Tiếp tục mua sắm
              </Button>,
              <Button key="orders" onClick={() => navigate('/orders', { replace: true })}>
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

          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleBackToCart}>
            Quay lại giỏ hàng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button type="button" className="checkout-header__back" onClick={handleBackToCart}>
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

              <Button type="link" className="checkout-stock-alert__link" onClick={handleBackToCart}>
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
                      normalize={normalizePhone}
                      rules={[
                        { required: true, message: 'Số điện thoại không được để trống!' },
                        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải đúng 10 chữ số!' },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="Nhập số điện thoại"
                        size="large"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </Form.Item>
                  </Col>

                  <Form.Item name="provinceName" hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item name="wardName" hidden>
                    <Input />
                  </Form.Item>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Tỉnh/Thành phố"
                      name="provinceCode"
                      rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố!' }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        size="large"
                        placeholder="Chọn tỉnh/thành phố"
                        loading={isLoadingProvinces}
                        options={provinceOptions}
                        optionFilterProp="label"
                        onChange={handleProvinceChange}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Phường/Xã/Đặc khu"
                      name="wardCode"
                      rules={[{ required: true, message: 'Vui lòng chọn phường/xã/đặc khu!' }]}
                    >
                      <Select
                        showSearch
                        allowClear
                        size="large"
                        disabled={!selectedProvinceCode}
                        placeholder={
                          selectedProvinceCode
                            ? 'Chọn phường/xã/đặc khu'
                            : 'Chọn tỉnh/thành phố trước'
                        }
                        loading={isLoadingWards}
                        options={wardOptions}
                        optionFilterProp="label"
                        onChange={handleWardChange}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label="Số nhà, tên đường"
                      name="addressLine"
                      rules={[{ required: true, message: 'Vui lòng nhập số nhà, tên đường!' }]}
                    >
                      <Input
                        prefix={<EnvironmentOutlined />}
                        placeholder="Ví dụ: Số 12, đường Nguyễn Huệ, chung cư A..."
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

              {/* VOUCHER PANEL */}
              <Divider className="checkout-summary-divider" />

              {/* Voucher row - clickable giống Shopee */}
              {!appliedVoucher ? (
                <div
                  onClick={() => !isRedirectingPayment && setIsModalVouchersOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    marginBottom: '10px',
                    border: '1.5px dashed #fb923c',
                    borderRadius: '10px',
                    cursor: isRedirectingPayment ? 'not-allowed' : 'pointer',
                    background: '#fff7ed',
                    transition: 'background 0.2s',
                  }}
                >
                  <TagOutlined style={{ color: '#ea580c', fontSize: '18px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#ea580c' }}>Mã giảm giá</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Chọn hoặc nhập mã khuyến mãi</div>
                  </div>
                  <RightOutlined style={{ color: '#ea580c', fontSize: '12px' }} />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    marginBottom: '10px',
                    border: '1.5px solid #16a34a',
                    borderRadius: '10px',
                    background: '#f0fdf4',
                  }}
                >
                  <CheckCircleFilled style={{ color: '#16a34a', fontSize: '18px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#15803d' }}>
                      {appliedVoucher.code}
                    </div>
                    <div style={{ fontSize: '12px', color: '#16a34a' }}>
                      Giảm {formatCurrency(appliedVoucher.discount)}
                    </div>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={handleRemoveVoucher}
                    disabled={isRedirectingPayment}
                    style={{ fontSize: '12px', height: 'auto', padding: '2px 8px' }}
                  >
                    Hủy
                  </Button>
                </div>
              )}

              {/* Ô nhập tay nếu muốn nhập trực tiếp */}
              <div className="checkout-voucher-section" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input
                    placeholder="Nhập mã giảm giá..."
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value)}
                    onPressEnter={!appliedVoucher ? handleApplyVoucher : undefined}
                    disabled={!!appliedVoucher || isRedirectingPayment}
                    style={{ textTransform: 'uppercase' }}
                    prefix={<TagOutlined style={{ color: '#d1d5db' }} />}
                  />
                  {!appliedVoucher && (
                    <Button
                      type="primary"
                      ghost
                      onClick={handleApplyVoucher}
                      loading={isValidatingVoucher}
                      disabled={isRedirectingPayment || !voucherCodeInput.trim()}
                    >
                      Áp dụng
                    </Button>
                  )}
                </div>
                {voucherError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <WarningOutlined />
                    {voucherError}
                  </div>
                )}
              </div>

              {appliedVoucher && (
                <div className="checkout-price-row">
                  <span style={{ color: '#16a34a' }}>Giảm giá ({appliedVoucher.code})</span>
                  <b style={{ color: '#16a34a' }}>-{formatCurrency(appliedVoucher.discount)}</b>
                </div>
              )}

              <Divider className="checkout-summary-divider" />

              <div className="checkout-total-row">
                <span>Tổng cần trả</span>
                <b>{formatCurrency(totalPrice - (appliedVoucher?.discount || 0))}</b>
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
            <b>{formatCurrency(totalPrice - (appliedVoucher?.discount || 0))}</b>
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

      <Modal
        title="Mã giảm giá khả dụng"
        open={isModalVouchersOpen}
        onCancel={() => setIsModalVouchersOpen(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px 0' }}>
          {isLoadingClientVouchers ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>Đang tải danh sách voucher...</div>
          ) : clientVouchers.length === 0 ? (
            <Empty description="Hiện chưa có mã giảm giá nào." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {clientVouchers.map((voucher) => {
                const isEligible = totalPrice >= voucher.minOrderValue;
                return (
                  <div
                    key={voucher._id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isEligible ? '#fff' : '#f9fafb',
                      opacity: isEligible ? 1 : 0.7,
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Tag color="orange" style={{ fontWeight: 700, fontSize: '13px' }}>
                          {voucher.code}
                        </Tag>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {voucher.discountType === 'PERCENTAGE'
                            ? `Giảm ${voucher.discountValue}%`
                            : `Giảm ${formatCurrency(voucher.discountValue)}`}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563' }}>
                        Áp dụng cho đơn hàng từ {formatCurrency(voucher.minOrderValue)}
                      </div>
                      {voucher.maxDiscountValue && voucher.discountType === 'PERCENTAGE' && (
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          Giảm tối đa: {formatCurrency(voucher.maxDiscountValue)}
                        </div>
                      )}
                      {voucher.endDate && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          HSD: {dayjs(voucher.endDate).format('DD-MM-YYYY HH:mm')}
                        </div>
                      )}
                    </div>
                    <div>
                      {isEligible ? (
                        <Button
                          type="primary"
                          size="small"
                          disabled={appliedVoucher?.code === voucher.code}
                          onClick={() => {
                            setVoucherCodeInput(voucher.code);
                            setIsModalVouchersOpen(false);
                            // Set a timeout to let the state update and apply automatically
                            setTimeout(async () => {
                              setIsValidatingVoucher(true);
                              setVoucherError(null);
                              try {
                                const res = await validateVoucherAPI(voucher.code, totalPrice);
                                if (res?.data?.isValid) {
                                  setAppliedVoucher({
                                    code: voucher.code,
                                    discount: res.data.discount,
                                  });
                                  message.success(res.message || 'Áp dụng mã giảm giá thành công!');
                                } else {
                                  setVoucherError(res?.data?.message || 'Mã giảm giá không hợp lệ');
                                  setAppliedVoucher(null);
                                }
                              } catch (err: any) {
                                setVoucherError(err?.response?.data?.message || 'Lỗi áp dụng');
                                setAppliedVoucher(null);
                              } finally {
                                setIsValidatingVoucher(false);
                              }
                            }, 50);
                          }}
                        >
                          {appliedVoucher?.code === voucher.code ? 'Đã dùng' : 'Dùng mã'}
                        </Button>
                      ) : (
                        <Tooltip title={`Đơn hàng tối thiểu phải từ ${formatCurrency(voucher.minOrderValue)}`}>
                          <Button size="small" disabled>
                            Chưa đủ ĐK
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutPage;
