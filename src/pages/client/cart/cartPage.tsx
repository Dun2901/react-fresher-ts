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
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useCurrentApp } from 'components/context/app.context.tsx';
import { clearCartAPI, removeCartItemAPI, updateCartItemAPI } from '@/services/api.ts';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './cartPage.scss';

const CartPage: React.FC = () => {
  const { carts, setCarts } = useCurrentApp();
  const navigate = useNavigate();

  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const nextDraftQuantities = carts.reduce<Record<string, number>>((result, item) => {
      result[item.bookId._id] = item.quantity;
      return result;
    }, {});

    setDraftQuantities(nextDraftQuantities);
  }, [carts]);

  const totalItems = useMemo(() => {
    return carts.reduce((total, item) => total + item.quantity, 0);
  }, [carts]);

  const totalPrice = useMemo(() => {
    return carts.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  }, [carts]);

  const stockWarningItems = useMemo(() => {
    return carts.filter(
      (item) => item.quantity > item.bookId.quantity || item.bookId.quantity <= 0,
    );
  }, [carts]);

  const hasStockWarning = stockWarningItems.length > 0;
  const isCheckoutDisabled = hasStockWarning || Boolean(updatingBookId) || clearingCart;

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

    if (!currentItem) {
      return;
    }

    if (quantity === currentItem.quantity) {
      return;
    }

    if (currentItem.bookId.quantity <= 0) {
      message.warning('Sách này hiện đã hết hàng.');
      setDraftQuantities((prev) => ({ ...prev, [bookId]: currentItem.quantity }));
      return;
    }

    if (quantity > currentItem.bookId.quantity) {
      message.warning(
        `Số lượng vượt quá tồn kho. Hiện còn ${currentItem.bookId.quantity} sản phẩm.`,
      );
      setDraftQuantities((prev) => ({ ...prev, [bookId]: currentItem.quantity }));
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
      setDraftQuantities((prev) => ({ ...prev, [bookId]: currentItem.quantity }));
    } finally {
      setUpdatingBookId(null);
    }
  };

  const handleDecreaseQuantity = (item: ICartItem) => {
    const nextQuantity = item.quantity - 1;

    if (nextQuantity < 1) {
      return;
    }

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
      <div className="cart-empty-state">
        <div className="cart-empty-state__card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="cart-empty-state__description">
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p>Hãy chọn thêm vài cuốn sách yêu thích trước khi đặt hàng nhé.</p>
              </div>
            }
          />

          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/book')}
            className="cart-empty-state__btn"
          >
            Mua sách ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <div className="cart-page-header">
        <div>
          <h2 className="cart-page-header__title">
            <ShoppingCartOutlined />
            Giỏ hàng
          </h2>
          <p className="cart-page-header__subtitle">
            Có {carts.length} sản phẩm, tổng {totalItems} cuốn sách trong giỏ hàng
          </p>
        </div>

        <Space wrap className="cart-page-header__actions">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/book')}
            className="cart-page-header__back-btn"
          >
            Tiếp tục mua sắm
          </Button>

          <Popconfirm
            title="Xóa toàn bộ giỏ hàng?"
            description="Bạn có chắc muốn xóa tất cả sản phẩm không?"
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
          icon={<WarningOutlined />}
          className="cart-stock-alert"
          message="Một số sản phẩm trong giỏ hàng cần cập nhật lại số lượng"
          description={
            <div className="cart-stock-alert__list">
              {stockWarningItems.map((item) => (
                <div key={item.bookId._id}>
                  <b>{item.bookId.mainText}</b>: đang chọn {item.quantity}, kho hiện còn{' '}
                  {item.bookId.quantity}
                </div>
              ))}
            </div>
          }
        />
      )}

      <Row gutter={[20, 20]} className="cart-main-row">
        <Col xs={24} lg={17}>
          <div className="cart-items-list">
            {carts.map((item) => {
              const bookId = item.bookId._id;
              const isCurrentItemLoading = updatingBookId === bookId;
              const isOutOfStock = item.bookId.quantity <= 0;
              const isOverStock = item.quantity > item.bookId.quantity;
              const itemTotalPrice = item.quantity * item.priceAtAdd;

              return (
                <div
                  key={bookId}
                  className={`cart-item-card ${isOverStock || isOutOfStock ? 'cart-item-card--warning' : ''}`}
                >
                  <div
                    className="cart-item-card__image-wrap"
                    onClick={() => navigate(`/book/${bookId}`)}
                  >
                    <img
                      src={getBookImageUrl(item.bookId.thumbnail)}
                      alt={item.bookId.mainText}
                      className="cart-item-card__image"
                    />
                  </div>

                  <div className="cart-item-card__content">
                    <div className="cart-item-card__top">
                      <div className="cart-item-card__info">
                        <h3
                          className="cart-item-card__title"
                          onClick={() => navigate(`/book/${bookId}`)}
                        >
                          {item.bookId.mainText}
                        </h3>

                        <div className="cart-item-card__unit-price">
                          Đơn giá: <b>{formatCurrency(item.priceAtAdd)}</b>
                        </div>

                        <div
                          className={`cart-item-card__stock ${
                            isOverStock || isOutOfStock ? 'cart-item-card__stock--warning' : ''
                          }`}
                        >
                          {isOutOfStock
                            ? 'Sản phẩm hiện đã hết hàng'
                            : `Còn kho: ${item.bookId.quantity}`}
                        </div>
                      </div>

                      <Popconfirm
                        title="Xóa sản phẩm?"
                        description="Bạn có chắc muốn xóa sản phẩm này không?"
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
                          className="cart-item-card__delete-btn"
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                    </div>

                    <div className="cart-item-card__bottom">
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

                      <div className="cart-item-card__total">
                        <span>Thành tiền</span>
                        <b>{formatCurrency(itemTotalPrice)}</b>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Col>

        <Col xs={24} lg={7}>
          <Card className="cart-summary-card">
            <div className="cart-summary-title">Tóm tắt đơn hàng</div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Số sản phẩm</span>
              <span>{carts.length}</span>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Tổng số lượng</span>
              <span>{totalItems}</span>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Tạm tính</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Phí vận chuyển</span>
              <span className="cart-summary-free">Miễn phí</span>
            </div>

            <Divider className="cart-summary-divider" />

            <div className="cart-summary-total-row">
              <span className="cart-summary-total-label">Tổng tiền</span>
              <span className="cart-summary-total-amount">{formatCurrency(totalPrice)}</span>
            </div>

            {hasStockWarning && (
              <Alert
                type="warning"
                showIcon
                className="cart-summary-alert"
                message="Vui lòng cập nhật lại số lượng trước khi đặt hàng."
              />
            )}

            <Button
              type="primary"
              size="large"
              block
              disabled={isCheckoutDisabled}
              className="cart-order-btn"
              onClick={() => navigate('/checkout')}
            >
              Đặt hàng ngay
            </Button>
          </Card>
        </Col>
      </Row>

      <div className="mobile-cart-summary-bar">
        <div className="mobile-cart-summary-bar__price">
          <span>Tổng tiền</span>
          <b>{formatCurrency(totalPrice)}</b>
        </div>

        <Button
          type="primary"
          disabled={isCheckoutDisabled}
          className="mobile-cart-summary-bar__btn"
          onClick={() => navigate('/checkout')}
        >
          Đặt hàng
        </Button>
      </div>
    </div>
  );
};

export default CartPage;
