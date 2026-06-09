import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Space,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useCurrentApp } from 'components/context/app.context.tsx';
import { clearCartAPI, removeCartItemAPI, updateCartItemAPI } from '@/services/api.ts';
import { formatCurrency } from '@/services/helper';
import './cartPage.scss';

const { Text } = Typography;

const CartPage: React.FC = () => {
  const { carts, setCarts } = useCurrentApp();
  const navigate = useNavigate();

  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const nextDraftQuantities = carts.reduce<Record<string, number>>((result, item) => {
      result[item.bookId._id] = item.quantity;
      return result;
    }, {});

    setDraftQuantities(nextDraftQuantities);
  }, [carts]);

  const stockWarningItems = useMemo(() => {
    return carts.filter((item) => item.quantity > item.bookId.quantity);
  }, [carts]);

  const hasStockWarning = stockWarningItems.length > 0;

  const calculateTotalPrice = () => {
    return carts.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  };

  const getErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (axios.isAxiosError(error)) {
      const responseMessage = error.response?.data?.message || error.response?.data?.error?.message;

      if (Array.isArray(responseMessage)) {
        return responseMessage[0] || fallbackMessage;
      }

      return responseMessage || fallbackMessage;
    }

    return fallbackMessage;
  };

  const updateCartQuantity = async (bookId: string, quantity: number) => {
    if (quantity < 1) {
      message.warning('Số lượng phải lớn hơn hoặc bằng 1');
      return;
    }

    const currentItem = carts.find((item) => item.bookId._id === bookId);

    if (!currentItem) return;

    if (quantity === currentItem.quantity) return;

    if (quantity > currentItem.bookId.quantity) {
      message.warning(
        `Số lượng vượt quá tồn kho. Hiện còn ${currentItem.bookId.quantity} sản phẩm.`,
      );
      setDraftQuantities((prev) => ({
        ...prev,
        [bookId]: currentItem.quantity,
      }));
      return;
    }

    setUpdatingBookId(bookId);

    try {
      const res = await updateCartItemAPI(bookId, quantity);

      if (res?.data) {
        setCarts(res.data.items || []);
      }
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể cập nhật số lượng!'));

      setDraftQuantities((prev) => ({
        ...prev,
        [bookId]: currentItem.quantity,
      }));
    } finally {
      setUpdatingBookId(null);
    }
  };

  const handleDecreaseQuantity = (item: ICartItem) => {
    const nextQuantity = item.quantity - 1;

    if (nextQuantity < 1) return;

    updateCartQuantity(item.bookId._id, nextQuantity);
  };

  const handleIncreaseQuantity = (item: ICartItem) => {
    const nextQuantity = item.quantity + 1;

    if (nextQuantity > item.bookId.quantity) {
      message.warning(`Số lượng vượt quá tồn kho. Hiện còn ${item.bookId.quantity} sản phẩm.`);
      return;
    }

    updateCartQuantity(item.bookId._id, nextQuantity);
  };

  const handleDraftQuantityChange = (bookId: string, value: number | null) => {
    setDraftQuantities((prev) => ({
      ...prev,
      [bookId]: value || 1,
    }));
  };

  const handleCommitDraftQuantity = (item: ICartItem) => {
    const bookId = item.bookId._id;
    const draftQuantity = draftQuantities[bookId] || 1;

    updateCartQuantity(bookId, draftQuantity);
  };

  const handleRemoveItem = async (bookId: string) => {
    setUpdatingBookId(bookId);

    try {
      const res = await removeCartItemAPI(bookId);

      if (res?.data) {
        setCarts(res.data.items || []);
        message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
      }
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể xóa sản phẩm!'));
    } finally {
      setUpdatingBookId(null);
    }
  };

  const handleClearCart = async () => {
    setClearingCart(true);

    try {
      const res = await clearCartAPI();

      if (res?.data) {
        setCarts(res.data.items || []);
        message.success('Đã xóa toàn bộ giỏ hàng!');
      }
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể xóa giỏ hàng!'));
    } finally {
      setClearingCart(false);
    }
  };

  if (carts.length === 0) {
    return (
      <div className="order-page-empty" style={{ padding: '50px 20px', textAlign: 'center' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Giỏ hàng của bạn đang trống không!"
        />

        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginTop: 20 }}
        >
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  return (
    <div
      className="order-page-container"
      style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 15px' }}
    >
      <div className="cart-page-header">
        <h2 className="order-title">
          <ShoppingCartOutlined /> Giỏ Hàng ({carts.length} sản phẩm)
        </h2>

        <Space wrap>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ paddingRight: 0, color: '#3481ed', fontSize: 16, fontWeight: 600 }}
          >
            Tiếp tục mua sắm
          </Button>

          <Popconfirm
            title="Xóa toàn bộ giỏ hàng?"
            description="Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng không?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={handleClearCart}
          >
            <Button danger icon={<DeleteOutlined />} loading={clearingCart}>
              Xóa giỏ hàng
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {hasStockWarning && (
        <Alert
          type="warning"
          showIcon
          className="cart-stock-alert"
          message="Một số sản phẩm trong giỏ hàng đã vượt quá số lượng tồn kho"
          description={
            <div>
              {stockWarningItems.map((item) => (
                <div key={item.bookId._id}>
                  {item.bookId.mainText}: đang chọn {item.quantity}, còn kho {item.bookId.quantity}
                </div>
              ))}
            </div>
          }
        />
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={17}>
          <div className="cart-items-list">
            {carts.map((item) => {
              const bookId = item.bookId._id;
              const isCurrentItemLoading = updatingBookId === bookId;
              const isOutOfStock = item.bookId.quantity <= 0;
              const isOverStock = item.quantity > item.bookId.quantity;

              return (
                <Card
                  key={bookId}
                  className={`cart-item-card ${isOverStock ? 'cart-item-card--warning' : ''}`}
                  style={{ marginBottom: 15 }}
                  bodyStyle={{ padding: '15px' }}
                >
                  <Row align="middle" gutter={[16, 16]}>
                    <Col xs={6} sm={4} style={{ textAlign: 'center' }}>
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${item.bookId.thumbnail}`}
                        alt={item.bookId.mainText}
                        style={{ width: '100%', maxHeight: 90, objectFit: 'contain' }}
                      />
                    </Col>

                    <Col xs={18} sm={10}>
                      <div
                        className="item-title"
                        style={{ fontWeight: 600, fontSize: 15, marginBottom: 5 }}
                      >
                        {item.bookId.mainText}
                      </div>

                      <div className="item-price-unit" style={{ color: '#8c8c8c', fontSize: 13 }}>
                        Đơn giá: {formatCurrency(item.priceAtAdd)}
                      </div>

                      {isOverStock && (
                        <Text type="danger" style={{ fontSize: 12 }}>
                          Số lượng trong giỏ đang vượt tồn kho
                        </Text>
                      )}
                    </Col>

                    <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                      <Space.Compact className="cart-quantity-control">
                        <Button
                          icon={<MinusOutlined />}
                          disabled={isCurrentItemLoading || item.quantity <= 1}
                          loading={isCurrentItemLoading}
                          onClick={() => handleDecreaseQuantity(item)}
                        />

                        <InputNumber
                          min={1}
                          value={draftQuantities[bookId] ?? item.quantity}
                          disabled={isCurrentItemLoading}
                          controls={false}
                          onChange={(value) => handleDraftQuantityChange(bookId, value)}
                          onBlur={() => handleCommitDraftQuantity(item)}
                          onPressEnter={() => handleCommitDraftQuantity(item)}
                        />

                        <Button
                          icon={<PlusOutlined />}
                          disabled={
                            isCurrentItemLoading ||
                            isOutOfStock ||
                            item.quantity >= item.bookId.quantity
                          }
                          onClick={() => handleIncreaseQuantity(item)}
                        />
                      </Space.Compact>

                      <div
                        style={{
                          fontSize: 11,
                          color: isOverStock ? '#ff4d4f' : '#8c8c8c',
                          marginTop: 4,
                        }}
                      >
                        Còn kho: {item.bookId.quantity}
                      </div>
                    </Col>

                    <Col xs={12} sm={4} style={{ textAlign: 'right' }}>
                      <div
                        className="item-total-price"
                        style={{ fontWeight: 600, color: '#ff4d4f', marginBottom: 10 }}
                      >
                        {formatCurrency(item.quantity * item.priceAtAdd)}
                      </div>

                      <Popconfirm
                        title="Xóa sản phẩm?"
                        description="Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng không?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleRemoveItem(bookId)}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={isCurrentItemLoading}
                          loading={isCurrentItemLoading}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </div>
        </Col>

        <Col xs={24} lg={7}>
          <Card className="cart-summary-card" style={{ position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Tóm tắt đơn hàng</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#595959' }}>Tạm tính:</span>
              <span>{formatCurrency(calculateTotalPrice())}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: '#595959' }}>Phí vận chuyển:</span>
              <span style={{ color: '#52c41a' }}>Miễn phí</span>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <span style={{ fontWeight: 600 }}>Tổng tiền:</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                {formatCurrency(calculateTotalPrice())}
              </span>
            </div>

            {hasStockWarning && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Vui lòng cập nhật lại số lượng trước khi đặt hàng."
              />
            )}

            <Button
              type="primary"
              size="large"
              block
              disabled={hasStockWarning || Boolean(updatingBookId)}
              style={{
                backgroundColor: hasStockWarning ? undefined : '#ff4d4f',
                borderColor: hasStockWarning ? undefined : '#ff4d4f',
                height: 45,
                fontWeight: 600,
              }}
              onClick={() => navigate('/checkout')}
            >
              Đặt hàng ngay
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CartPage;
