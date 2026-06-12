import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Button, InputNumber, Divider, Image, message, Spin, Empty, Tag } from 'antd';
import {
  ShoppingCartOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  UserOutlined,
  TagsOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  TruckOutlined,
  ShopOutlined,
  StarOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { getBookByIdAPI, addItemToCartAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import { useCurrentApp } from 'components/context/app.context.tsx';
import axios from 'axios';
import './bookDetailPage.scss';

const FALLBACK_BOOK_IMAGE = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600';

const AUTH_MESSAGE_KEY = 'auth-message-warning';

type BookDetailLocationState = {
  from?: string;
  fromLabel?: string;
} | null;

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, carts, setCarts } = useCurrentApp();

  const routeState = location.state as BookDetailLocationState;
  const from = routeState?.from;
  const fromLabel = routeState?.fromLabel;

  const [bookData, setBookData] = useState<IBookTable | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isInCart = useMemo(() => {
    if (!bookData) {
      return false;
    }

    return carts.some((item) => item.bookId?._id === bookData._id);
  }, [bookData, carts]);

  const allImages = useMemo(() => {
    if (!bookData) {
      return [];
    }

    const images = [
      getBookImageUrl(bookData.thumbnail) || FALLBACK_BOOK_IMAGE,
      ...(bookData.slider || []).map((img) => getBookImageUrl(img)).filter(Boolean),
    ];

    return Array.from(new Set(images));
  }, [bookData]);

  const canSlideImages = allImages.length > 1;

  const availableQuantity = bookData?.quantity ?? 0;
  const isOutOfStock = availableQuantity <= 0;

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1);
      return;
    }

    if (from) {
      navigate(from, { replace: true });
      return;
    }

    navigate('/book', { replace: true });
  };

  const getBackButtonLabel = () => {
    if (fromLabel) {
      return `Quay lại ${fromLabel}`;
    }

    return 'Quay lại danh sách sách';
  };

  const handlePrevImage = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();

    if (!canSlideImages) {
      return;
    }

    setCurrentImageIndex((prev) => {
      if (prev <= 0) {
        return allImages.length - 1;
      }

      return prev - 1;
    });
  };

  const handleNextImage = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();

    if (!canSlideImages) {
      return;
    }

    setCurrentImageIndex((prev) => {
      if (prev >= allImages.length - 1) {
        return 0;
      }

      return prev + 1;
    });
  };

  const handleSelectImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  useEffect(() => {
    const fetchBookDetail = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const res = await getBookByIdAPI(id);

        if (res?.data) {
          setBookData(res.data);
          setCurrentImageIndex(0);
          setBuyQuantity(1);
        }
      } catch (error) {
        message.error('Không thể tải thông tin chi tiết sách.');
        console.error('Lỗi hệ thống:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetail();
  }, [id]);

  useEffect(() => {
    if (currentImageIndex > allImages.length - 1) {
      setCurrentImageIndex(0);
    }
  }, [allImages.length, currentImageIndex]);

  const handleQuantityChange = (value: number | null) => {
    if (!bookData || isOutOfStock) {
      return;
    }

    const nextValue = Number(value || 1);
    const validValue = Math.min(Math.max(nextValue, 1), bookData.quantity);

    setBuyQuantity(validValue);
  };

  const handleAddToCart = async (goToCart = false) => {
    if (!isAuthenticated) {
      message.open({
        key: AUTH_MESSAGE_KEY,
        type: 'warning',
        content: goToCart
          ? 'Bạn cần đăng nhập để mua sản phẩm.'
          : 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.',
        duration: 2,
      });
      return;
    }

    if (!bookData || isOutOfStock) {
      message.open({
        key: 'book-stock-warning',
        type: 'warning',
        content: 'Sách này hiện đã hết hàng.',
        duration: 2,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await addItemToCartAPI(bookData._id, buyQuantity);

      if (res?.data) {
        setCarts(res.data.items || []);

        message.success(`Đã thêm ${buyQuantity} cuốn vào giỏ hàng!`);

        if (goToCart) {
          navigate('/cart', { replace: true });
        }
      }
    } catch (error) {
      let errorMsg = 'Không thể thêm sách vào giỏ hàng!';

      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      }

      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="book-detail-status">
        <Spin indicator={<LoadingOutlined className="book-detail-status__icon" spin />} />
        <p>Đang tải thông tin sách...</p>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="book-detail-status">
        <Empty description="Không tìm thấy sách yêu cầu" />

        <Button type="primary" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {getBackButtonLabel()}
        </Button>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      <div className="detail-shell">
        <button type="button" className="detail-back-btn" onClick={handleBack}>
          <ArrowLeftOutlined />
          <span>{getBackButtonLabel()}</span>
        </button>

        <div className="detail-top-card">
          <Row gutter={[24, 24]} className="detail-main-row">
            <Col xs={24} md={10} className="detail-gallery-col">
              <div className="detail-gallery-card">
                <div className="main-image-wrapper">
                  <div className="gallery-preview-group">
                    <Image.PreviewGroup
                      preview={{
                        current: currentImageIndex,
                        onChange: (current) => {
                          setCurrentImageIndex(current);
                        },
                      }}
                    >
                      {allImages.map((imgUrl, index) => (
                        <div
                          key={`${imgUrl}-${index}`}
                          className={`gallery-preview-item ${
                            currentImageIndex === index ? 'gallery-preview-item--active' : ''
                          }`}
                        >
                          <Image
                            src={imgUrl}
                            fallback={FALLBACK_BOOK_IMAGE}
                            alt={`${bookData.mainText} - ảnh ${index + 1}`}
                          />
                        </div>
                      ))}
                    </Image.PreviewGroup>
                  </div>

                  {canSlideImages && (
                    <>
                      <button
                        type="button"
                        className="gallery-nav-btn gallery-nav-btn--prev"
                        onClick={handlePrevImage}
                        aria-label="Xem ảnh trước"
                      >
                        <LeftOutlined />
                      </button>

                      <button
                        type="button"
                        className="gallery-nav-btn gallery-nav-btn--next"
                        onClick={handleNextImage}
                        aria-label="Xem ảnh tiếp theo"
                      >
                        <RightOutlined />
                      </button>

                      <div className="gallery-counter">
                        {currentImageIndex + 1}/{allImages.length}
                      </div>
                    </>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="thumbnail-list">
                    {allImages.map((imgUrl, idx) => (
                      <button
                        type="button"
                        key={`${imgUrl}-${idx}`}
                        className={`thumb-item ${currentImageIndex === idx ? 'active' : ''}`}
                        onClick={() => handleSelectImage(idx)}
                        aria-label={`Xem ảnh sách ${idx + 1}`}
                      >
                        <img src={imgUrl} alt={`Ảnh sách ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} md={14} className="detail-info-col">
              <div className="detail-info-card">
                <div className="book-top-tags">
                  <Tag color="blue">{bookData.category?.name || 'Chưa có danh mục'}</Tag>

                  {isInCart && (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Đã có trong giỏ
                    </Tag>
                  )}

                  {!isOutOfStock ? (
                    <Tag color="green">Còn hàng</Tag>
                  ) : (
                    <Tag color="red">Hết hàng</Tag>
                  )}
                </div>

                <h1 className="product-title">{bookData.mainText}</h1>

                <div className="price-highlight-card">
                  <span className="price-label">Giá bán</span>
                  <div className="current-price">{formatCurrency(bookData.price)}</div>
                </div>

                <div className="mobile-summary-row">
                  <div className="summary-item">
                    <UserOutlined />
                    <span>Tác giả</span>
                    <b>{bookData.author || 'Chưa cập nhật'}</b>
                  </div>

                  <div className="summary-item">
                    <ShoppingCartOutlined />
                    <span>Đã bán</span>
                    <b>{bookData.sold ?? 0}</b>
                  </div>

                  <div className="summary-item">
                    <StarOutlined />
                    <span>Đánh giá</span>
                    <b>Chưa có</b>
                  </div>
                </div>

                <div className="desktop-meta-line">
                  <span>
                    <UserOutlined />
                    Tác giả: <b>{bookData.author || 'Chưa cập nhật'}</b>
                  </span>

                  <span>
                    <ShoppingCartOutlined />
                    Đã bán: <b>{bookData.sold ?? 0}</b>
                  </span>

                  <span>
                    <StarOutlined />
                    Đánh giá: <b>Chưa có</b>
                  </span>
                </div>

                <div className="quick-info-grid">
                  <div className="quick-info-item">
                    <span className="quick-info-item__icon">
                      <TagsOutlined />
                    </span>
                    <div className="quick-info-item__content">
                      <small>Danh mục</small>
                      <b>{bookData.category?.name || 'Chưa cập nhật'}</b>
                    </div>
                  </div>

                  <div className="quick-info-item">
                    <span className="quick-info-item__icon">
                      <InboxOutlined />
                    </span>
                    <div className="quick-info-item__content">
                      <small>Tồn kho</small>
                      <b>{isOutOfStock ? 'Hết hàng' : `Còn ${bookData.quantity} cuốn`}</b>
                    </div>
                  </div>

                  <div className="quick-info-item">
                    <span className="quick-info-item__icon">
                      <SafetyCertificateOutlined />
                    </span>
                    <div className="quick-info-item__content">
                      <small>Tình trạng</small>
                      <b>{isOutOfStock ? 'Tạm hết hàng' : 'Có thể đặt mua'}</b>
                    </div>
                  </div>
                </div>

                <Divider className="detail-divider" />

                <div className="quantity-row">
                  <div className="quantity-row__label">Số lượng</div>

                  <div className="quantity-row__content">
                    <InputNumber
                      min={1}
                      max={Math.max(bookData.quantity, 1)}
                      value={buyQuantity}
                      disabled={isOutOfStock}
                      onChange={handleQuantityChange}
                    />

                    <span className="stock-note">
                      {isOutOfStock
                        ? 'Sản phẩm hiện đã hết hàng'
                        : `${bookData.quantity} sản phẩm có sẵn`}
                    </span>
                  </div>
                </div>

                <div className="desktop-action-row">
                  <Button
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    className="btn-add-cart"
                    loading={isSubmitting}
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(false)}
                  >
                    {isInCart ? 'Mua thêm' : 'Thêm vào giỏ hàng'}
                  </Button>

                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    className="btn-buy-now"
                    loading={isSubmitting}
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(true)}
                  >
                    Mua ngay
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Row gutter={[20, 20]} className="detail-bottom-row">
          <Col xs={24} lg={16}>
            <div className="detail-section-card">
              <h3 className="section-title">Thông tin sản phẩm</h3>

              <div className="product-info-table">
                <div className="product-info-row">
                  <span className="product-info-row__label">Tên sách</span>
                  <span className="product-info-row__value">{bookData.mainText}</span>
                </div>

                <div className="product-info-row">
                  <span className="product-info-row__label">Tác giả</span>
                  <span className="product-info-row__value">
                    {bookData.author || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="product-info-row">
                  <span className="product-info-row__label">Danh mục</span>
                  <span className="product-info-row__value">
                    {bookData.category?.name || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="product-info-row">
                  <span className="product-info-row__label">Số lượng còn lại</span>
                  <span className="product-info-row__value">
                    {isOutOfStock ? 'Hết hàng' : `${bookData.quantity} cuốn`}
                  </span>
                </div>

                <div className="product-info-row">
                  <span className="product-info-row__label">Đã bán</span>
                  <span className="product-info-row__value">{bookData.sold ?? 0}</span>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div className="detail-section-card">
              <h3 className="section-title">Cam kết từ BookStore</h3>

              <div className="service-list">
                <div className="service-item">
                  <span className="service-item__icon">
                    <TruckOutlined />
                  </span>
                  <div className="service-item__content">
                    <b>Giao hàng thuận tiện</b>
                    <p>Theo dõi đơn hàng dễ dàng trong tài khoản của bạn.</p>
                  </div>
                </div>

                <div className="service-item">
                  <span className="service-item__icon">
                    <ShopOutlined />
                  </span>
                  <div className="service-item__content">
                    <b>Mua sắm dễ sử dụng</b>
                    <p>Thêm vào giỏ hàng nhanh, thanh toán linh hoạt.</p>
                  </div>
                </div>

                <div className="service-item">
                  <span className="service-item__icon">
                    <SafetyCertificateOutlined />
                  </span>
                  <div className="service-item__content">
                    <b>Thông tin rõ ràng</b>
                    <p>Hiển thị đầy đủ giá bán, tồn kho và tình trạng sản phẩm.</p>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      <div className="mobile-sticky-bar">
        <div className="mobile-sticky-bar__price">
          <span>Tạm tính</span>
          <b>{formatCurrency(bookData.price * Math.max(buyQuantity, 1))}</b>
        </div>

        <div className="mobile-sticky-bar__actions">
          <Button
            icon={<ShoppingCartOutlined />}
            className="btn-mobile-cart"
            loading={isSubmitting}
            disabled={isOutOfStock}
            onClick={() => handleAddToCart(false)}
          />

          <Button
            type="primary"
            className="btn-mobile-buy"
            loading={isSubmitting}
            disabled={isOutOfStock}
            onClick={() => handleAddToCart(true)}
          >
            Mua ngay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
