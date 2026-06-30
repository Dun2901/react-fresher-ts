import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Empty,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Skeleton,
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
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import { useCurrentApp } from 'components/context/app.context.tsx';
import { clearCartAPI, removeCartItemAPI, updateCartItemAPI } from '@/services/api.ts';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './cartPage.scss';
import { BackNavigationState, getBackFromState, getCurrentPath } from '@/utils/navigation';

const CartPage: React.FC = () => {
  const { carts, setCarts, isCartLoading } = useCurrentApp();

  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as BackNavigationState;

  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

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

  useEffect(() => {
    const eligibleBookIds = carts
      .filter((item) => item.bookId.quantity > 0 && item.quantity <= item.bookId.quantity)
      .map((item) => item.bookId._id);

    setSelectedBookIds((prev) => prev.filter((bookId) => eligibleBookIds.includes(bookId)));
  }, [carts]);

  const selectedBookIdSet = useMemo(() => {
    return new Set(selectedBookIds);
  }, [selectedBookIds]);

  const totalItems = useMemo(() => {
    return carts.reduce((total, item) => total + item.quantity, 0);
  }, [carts]);

  const eligibleBookIds = useMemo(() => {
    return carts
      .filter((item) => item.bookId.quantity > 0 && item.quantity <= item.bookId.quantity)
      .map((item) => item.bookId._id);
  }, [carts]);

  const selectedCartItems = useMemo(() => {
    return carts.filter((item) => selectedBookIdSet.has(item.bookId._id));
  }, [carts, selectedBookIdSet]);

  const selectedTotalItems = useMemo(() => {
    return selectedCartItems.reduce((total, item) => total + item.quantity, 0);
  }, [selectedCartItems]);

  const selectedTotalPrice = useMemo(() => {
    return selectedCartItems.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  }, [selectedCartItems]);

  const stockWarningItems = useMemo(() => {
    return carts.filter(
      (item) => item.quantity > item.bookId.quantity || item.bookId.quantity <= 0,
    );
  }, [carts]);

  const selectedStockWarningItems = useMemo(() => {
    return selectedCartItems.filter(
      (item) => item.quantity > item.bookId.quantity || item.bookId.quantity <= 0,
    );
  }, [selectedCartItems]);

  const hasStockWarning = stockWarningItems.length > 0;
  const hasSelectedStockWarning = selectedStockWarningItems.length > 0;

  const isAllSelected =
    eligibleBookIds.length > 0 && eligibleBookIds.every((bookId) => selectedBookIdSet.has(bookId));

  const isIndeterminate =
    selectedBookIds.length > 0 &&
    eligibleBookIds.some((bookId) => selectedBookIdSet.has(bookId)) &&
    !isAllSelected;

  const isCheckoutDisabled =
    selectedCartItems.length === 0 ||
    hasSelectedStockWarning ||
    Boolean(updatingBookId) ||
    clearingCart;

  const handleBack = () => {
    navigate(getBackFromState(routeState) || '/book');
  };

  const handleViewBookDetail = (bookId: string) => {
    navigate(`/book/${bookId}`, {
      state: {
        from: location.pathname + location.search,
        fromLabel: 'giỏ hàng',
      },
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedBookIds(checked ? eligibleBookIds : []);
  };

  const handleToggleSelectItem = (bookId: string, checked: boolean) => {
    setSelectedBookIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, bookId]));
      }

      return prev.filter((id) => id !== bookId);
    });
  };

  const handleToggleCartItem = (
    item: ICartItem,
    isSelected: boolean,
    isCurrentItemLoading: boolean,
  ) => {
    const bookId = item.bookId._id;
    const isOutOfStock = item.bookId.quantity <= 0;
    const isOverStock = item.quantity > item.bookId.quantity;

    if (isCurrentItemLoading) {
      return;
    }

    if (isOutOfStock) {
      message.warning('Sản phẩm này hiện đã hết hàng, không thể chọn để đặt hàng.');
      return;
    }

    if (isOverStock) {
      message.warning('Số lượng sản phẩm này đang vượt quá tồn kho, vui lòng cập nhật lại.');
      return;
    }

    handleToggleSelectItem(bookId, !isSelected);
  };

  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng.');
      return;
    }

    if (hasSelectedStockWarning) {
      message.warning('Sản phẩm đã chọn có số lượng không hợp lệ. Vui lòng cập nhật lại.');
      return;
    }

    sessionStorage.setItem('checkout_selected_book_ids', JSON.stringify(selectedBookIds));

    navigate('/checkout', {
      state: {
        selectedBookIds,
        from: getCurrentPath(location),
        fromLabel: 'giỏ hàng',
      },
    });
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

    if (!currentItem) {
      return;
    }

    if (quantity === currentItem.quantity) {
      return;
    }

    if (currentItem.bookId.quantity <= 0) {
      message.warning('Sách này hiện đã hết hàng.');
      setDraftQuantities((prev) => ({
        ...prev,
        [bookId]: currentItem.quantity,
      }));
      return;
    }

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
        setSelectedBookIds([]);
        sessionStorage.removeItem('checkout_selected_book_ids');
        message.success('Đã xóa toàn bộ giỏ hàng!');
      }
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể xóa giỏ hàng!'));
    } finally {
      setClearingCart(false);
    }
  };

  if (isCartLoading) {
    return (
      <div className="cart-empty-state">
        <div className="cart-empty-state__card">
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 16 }} />
        </div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="cart-empty-state">
        <div className="cart-empty-state__card">
          <button type="button" className="cart-empty-state__back" onClick={handleBack}>
            <ArrowLeftOutlined />
            <span>Tiếp tục mua sắm</span>
          </button>

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
        <div className="cart-page-header__mobile-title-row">
          <button type="button" className="cart-page-header__mobile-back" onClick={handleBack}>
            <ArrowLeftOutlined />
          </button>

          <h2>Giỏ hàng của bạn</h2>
        </div>

        <div className="cart-page-header__title-box">
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
            onClick={handleBack}
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
              const isSelectable = !isOutOfStock && !isOverStock;
              const isSelected = selectedBookIdSet.has(bookId);
              const itemTotalPrice = item.quantity * item.priceAtAdd;

              return (
                <div
                  key={bookId}
                  className={`cart-item-card ${
                    isOverStock || isOutOfStock ? 'cart-item-card--warning' : ''
                  } ${isSelected ? 'cart-item-card--selected' : ''}`}
                  onClick={() => handleToggleCartItem(item, isSelected, isCurrentItemLoading)}
                >
                  <div
                    className="cart-item-card__checkbox"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={!isSelectable || isCurrentItemLoading}
                      onChange={(event) => handleToggleSelectItem(bookId, event.target.checked)}
                    />
                  </div>

                  <div className="cart-item-card__image-wrap">
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
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewBookDetail(bookId);
                          }}
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

                      <div
                        className="cart-item-card__delete-area"
                        onClick={(event) => event.stopPropagation()}
                      >
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
                    </div>

                    <div className="cart-item-card__bottom">
                      <div
                        className="cart-item-card__quantity-area"
                        onClick={(event) => event.stopPropagation()}
                      >
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
                      </div>

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

            <div className="cart-summary-select-all">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                disabled={eligibleBookIds.length === 0}
                onChange={(event) => handleToggleSelectAll(event.target.checked)}
              >
                Chọn tất cả sản phẩm hợp lệ
              </Checkbox>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Đã chọn</span>
              <span>{selectedCartItems.length} sản phẩm</span>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Tổng số lượng</span>
              <span>{selectedTotalItems}</span>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Tạm tính</span>
              <span>{formatCurrency(selectedTotalPrice)}</span>
            </div>

            <div className="cart-summary-row">
              <span className="cart-summary-label">Phí vận chuyển</span>
              <span className="cart-summary-free">Miễn phí</span>
            </div>

            <Divider className="cart-summary-divider" />

            <div className="cart-summary-total-row">
              <span className="cart-summary-total-label">Tổng tiền</span>
              <span className="cart-summary-total-amount">
                {formatCurrency(selectedTotalPrice)}
              </span>
            </div>

            {hasSelectedStockWarning && (
              <Alert
                type="warning"
                showIcon
                className="cart-summary-alert"
                message="Vui lòng cập nhật lại số lượng sản phẩm đã chọn."
              />
            )}

            <Button
              type="primary"
              size="large"
              block
              disabled={isCheckoutDisabled}
              className="cart-order-btn"
              onClick={handleCheckout}
            >
              Đặt hàng ngay
            </Button>
          </Card>
        </Col>
      </Row>

      <div className="mobile-cart-summary-bar">
        <div className="mobile-cart-summary-bar__select">
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            disabled={eligibleBookIds.length === 0}
            onChange={(event) => handleToggleSelectAll(event.target.checked)}
          >
            Chọn tất cả
          </Checkbox>
        </div>

        <div className="mobile-cart-summary-bar__price">
          <span>Tạm tính</span>
          <b>{formatCurrency(selectedTotalPrice)}</b>
        </div>

        <Button
          type="primary"
          disabled={isCheckoutDisabled}
          className="mobile-cart-summary-bar__btn"
          onClick={handleCheckout}
        >
          Mua ngay
        </Button>
      </div>
    </div>
  );
};

export default CartPage;
