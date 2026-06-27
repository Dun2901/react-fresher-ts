import React, { useEffect, useState } from 'react';
import { Row, Col, Button, message, Spin, Carousel, Empty } from 'antd';
import {
  ShoppingCartOutlined,
  LoadingOutlined,
  ArrowRightOutlined,
  FireOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TruckOutlined,
  CreditCardOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  StarFilled,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context.tsx';
import { addItemToCartAPI, getBooksAPI } from '@/services/api.ts';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import axios from 'axios';
import './home.scss';

const Homepage: React.FC = () => {
  const navigate = useNavigate();

  const { isAuthenticated, carts, setCarts } = useCurrentApp();

  const [listBook, setListBook] = useState<IBookTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pageSize = 18;

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);

      try {
        const query = `current=1&pageSize=${pageSize}&sort=-createdAt`;
        const res = await getBooksAPI(query);

        if (res?.data) {
          setListBook(res.data.result || []);
        }
      } catch (error) {
        message.error('Không thể tải danh sách sách. Vui lòng thử lại sau.');
        console.error('Lỗi hệ thống:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, []);

  const showLoginRequiredMessage = () => {
    message.warning('Vui lòng đăng nhập để sử dụng chức năng này.');
  };

  const handleAuthOnlyAction = (path: string) => {
    if (!isAuthenticated) {
      showLoginRequiredMessage();
      return;
    }

    navigate(path);
  };

  const handleAddToCart = async (book: IBookTable) => {
    if (!isAuthenticated) {
      showLoginRequiredMessage();
      return;
    }

    try {
      const res = await addItemToCartAPI(book._id, 1);

      if (res?.data) {
        setCarts(res.data.items || []);
        message.success(`Đã thêm "${book.mainText}" vào giỏ hàng!`);
      }
    } catch (error) {
      let errorMsg = 'Không thể thêm sản phẩm vào giỏ hàng!';

      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      }

      message.error(errorMsg);
    }
  };

  const shortcutItems = [
    {
      label: 'Sách mới',
      icon: <FireOutlined />,
      onClick: () => navigate('/book'),
    },
    {
      label: 'Danh mục',
      icon: <AppstoreOutlined />,
      onClick: () => navigate('/book'),
    },
    {
      label: 'Giỏ hàng',
      icon: <ShoppingCartOutlined />,
      onClick: () => handleAuthOnlyAction('/cart'),
    },
    {
      label: 'Đơn hàng',
      icon: <HistoryOutlined />,
      onClick: () => handleAuthOnlyAction('/orders'),
    },
  ];

  const serviceItems = [
    {
      icon: <TruckOutlined />,
      title: 'Giao sách tận nhà',
      desc: 'Đặt nhanh, nhận sách tiện lợi',
    },
    {
      icon: <CreditCardOutlined />,
      title: 'COD & VNPay',
      desc: 'Thanh toán linh hoạt',
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: 'Theo dõi đơn dễ dàng',
      desc: 'Cập nhật trạng thái liên tục',
    },
    {
      icon: <GiftOutlined />,
      title: 'Sách mới mỗi ngày',
      desc: 'Gợi ý phù hợp cho bạn',
    },
  ];

  const categoryPills = ['Sách mới', 'Kỹ năng sống', 'Kinh doanh', 'Công nghệ', 'Tiểu thuyết'];

  return (
    <div className="homepage-shop">
      <section className="homepage-hero">
        <Carousel autoplay effect="fade" className="shop-carousel">
          <div>
            <div className="banner-slide banner-slide--warm">
              <div className="banner-inner">
                <span className="badge-promo">
                  <BookOutlined /> Gợi ý hôm nay
                </span>

                <h1>Sách hay giao tận nhà, đọc thoải mái mỗi ngày</h1>

                <p>
                  Khám phá sách công nghệ, kinh doanh, kỹ năng và nhiều đầu sách mới phù hợp với
                  người Việt.
                </p>

                <div className="banner-actions">
                  <Button type="primary" onClick={() => navigate('/book')}>
                    Mua sách ngay
                  </Button>

                  <Button className="banner-secondary-btn" onClick={() => navigate('/book')}>
                    Xem danh mục
                  </Button>
                </div>
              </div>

              <div className="banner-highlight-card">
                <span className="banner-highlight-card__label">BookStore</span>
                <strong>Đọc một cuốn sách hay hôm nay</strong>
                <p>thêm một lựa chọn tốt cho ngày mai.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="banner-slide banner-slide--soft">
              <div className="banner-inner">
                <span className="badge-promo">
                  <FireOutlined /> Sách mới lên kệ
                </span>

                <h1>Chọn sách phù hợp với nhu cầu của bạn</h1>

                <p>
                  Dễ tìm, dễ mua, dễ theo dõi đơn hàng. Trải nghiệm mua sách đơn giản và thân thiện.
                </p>

                <div className="banner-actions">
                  <Button type="primary" onClick={() => navigate('/book')}>
                    Khám phá ngay
                  </Button>

                  <Button
                    className="banner-secondary-btn"
                    onClick={() => handleAuthOnlyAction('/orders')}
                  >
                    Theo dõi đơn
                  </Button>
                </div>
              </div>

              <div className="banner-highlight-card">
                <span className="banner-highlight-card__label">Nhanh chóng</span>
                <strong>Đặt sách online</strong>
                <p>thanh toán COD hoặc VNPay tiện lợi.</p>
              </div>
            </div>
          </div>
        </Carousel>
      </section>

      <section className="homepage-service-strip">
        {serviceItems.map((item) => (
          <div className="homepage-service-card" key={item.title}>
            <span className="homepage-service-card__icon">{item.icon}</span>

            <div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mobile-shortcut-bar">
        {shortcutItems.map((item) => (
          <button type="button" key={item.label} onClick={item.onClick}>
            <span className="mobile-shortcut-bar__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <section className="homepage-category-row">
        <div className="homepage-category-row__title">
          <AppstoreOutlined />
          <span>Khám phá nhanh</span>
        </div>

        <div className="homepage-category-row__list">
          {categoryPills.map((item) => (
            <button type="button" key={item} onClick={() => navigate('/book')}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="homepage-products-section">
        <div className="content-title-wrapper">
          <div>
            <span className="section-eyebrow">Dành cho bạn</span>
            <h2 className="section-title">Sách mới lên kệ</h2>
            <p className="section-subtitle">Những cuốn sách mới nhất đang có trong BookStore</p>
          </div>

          <button type="button" className="section-more" onClick={() => navigate('/book')}>
            Xem thêm <ArrowRightOutlined />
          </button>
        </div>

        <Spin
          spinning={isLoading}
          indicator={<LoadingOutlined className="homepage-loading-icon" spin />}
        >
          {!isLoading && listBook.length === 0 ? (
            <Empty description="Chưa có sách để hiển thị" />
          ) : (
            <Row gutter={[6, 8]} className="homepage-product-grid">
              {listBook.map((book) => {
                const inCart = carts.some((item) => item.bookId?._id === book._id);
                const averageRating = book.averageRating ?? 0;
                const reviewCount = book.reviewCount ?? 0;
                const sold = book.sold ?? 0;

                return (
                  <Col xs={12} sm={8} md={6} lg={6} xl={4} xxl={4} key={book._id}>
                    <div className="book-card-shopee" onClick={() => navigate(`/book/${book._id}`)}>
                      <div className="book-card-shopee__img-wrap">
                        <img
                          alt={book.mainText}
                          src={getBookImageUrl(book.thumbnail)}
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';
                          }}
                        />

                        <span className="book-card-shopee__tag">Sách mới</span>
                      </div>

                      <div className="book-card-shopee__info">
                        <div className="book-card-shopee__title" title={book.mainText}>
                          {book.mainText}
                        </div>

                        <div className="book-card-shopee__author">
                          {book.author || 'Đang cập nhật'}
                        </div>

                        <div className="book-card-shopee__meta">
                          <span>
                            <StarFilled /> {reviewCount > 0 ? averageRating.toFixed(1) : 'Mới'}
                          </span>

                          <span>{sold > 0 ? `${sold} đã bán` : 'Mới cập nhật'}</span>
                        </div>

                        <div className="book-card-shopee__bottom">
                          <div className="book-card-shopee__price">
                            {formatCurrency(book.price)}
                          </div>

                          <button
                            type="button"
                            className={`book-card-shopee__btn ${
                              inCart ? 'book-card-shopee__btn--incart' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(book);
                            }}
                            aria-label={inCart ? 'Mua thêm' : 'Thêm vào giỏ hàng'}
                            title={inCart ? 'Mua thêm' : 'Thêm vào giỏ hàng'}
                          >
                            <ShoppingCartOutlined className="book-card-shopee__cart-icon" />
                            <span className="book-card-shopee__btn-text">
                              {inCart ? 'Mua thêm' : 'Thêm giỏ'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}

          {!isLoading && listBook.length > 0 && (
            <div className="view-all-container">
              <Button
                type="primary"
                className="btn-view-all"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/book')}
              >
                Xem tất cả sách
              </Button>
            </div>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default Homepage;
