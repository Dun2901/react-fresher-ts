import React, { useEffect, useState } from 'react';
import { Row, Col, Button, message, Spin, Carousel, Empty } from 'antd';
import {
  ShoppingCartOutlined,
  LoadingOutlined,
  ArrowRightOutlined,
  FireOutlined,
  BookOutlined,
  HistoryOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context.tsx';
import { addItemToCartAPI, getBooksAPI } from '@/services/api.ts';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import axios from 'axios';
import './home.scss';

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { carts, setCarts } = useCurrentApp();

  const [listBook, setListBook] = useState<IBookTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pageSize = 12;

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

  const handleAddToCart = async (book: IBookTable) => {
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

  return (
    <div className="homepage-shop">
      <Carousel autoplay effect="fade" className="shop-carousel">
        <div>
          <div className="banner-slide slide-1">
            <div className="banner-inner">
              <span className="badge-promo">Ưu đãi hôm nay</span>
              <h1>Khám phá sách hay mỗi ngày</h1>
              <p>Sách công nghệ, kinh doanh, kỹ năng và nhiều đầu sách mới đang có sẵn.</p>

              <Button type="primary" danger onClick={() => navigate('/book')}>
                Xem sách ngay
              </Button>
            </div>
          </div>
        </div>

        <div>
          <div className="banner-slide slide-2">
            <div className="banner-inner">
              <span className="badge-promo">Sách mới</span>
              <h1>Bổ sung tri thức cho hành trình của bạn</h1>
              <p>Chọn sách phù hợp, đặt hàng nhanh và theo dõi đơn hàng dễ dàng.</p>

              <Button type="primary" className="banner-green-btn" onClick={() => navigate('/book')}>
                Khám phá ngay
              </Button>
            </div>
          </div>
        </div>
      </Carousel>

      <div className="mobile-shortcut-bar">
        <button type="button" onClick={() => navigate('/book')}>
          <span className="mobile-shortcut-bar__icon">
            <FireOutlined />
          </span>
          Sách mới
        </button>

        <button type="button" onClick={() => navigate('/book')}>
          <span className="mobile-shortcut-bar__icon">
            <AppstoreOutlined />
          </span>
          Danh mục
        </button>

        <button type="button" onClick={() => navigate('/cart')}>
          <span className="mobile-shortcut-bar__icon">
            <ShoppingCartOutlined />
          </span>
          Giỏ hàng
        </button>

        <button type="button" onClick={() => navigate('/orders')}>
          <span className="mobile-shortcut-bar__icon">
            <HistoryOutlined />
          </span>
          Đơn hàng
        </button>
      </div>

      <div className="homepage-products-section">
        <div className="content-title-wrapper">
          <div>
            <h2 className="section-title">Gợi ý hôm nay</h2>
            <p className="section-subtitle">Những cuốn sách mới nhất trong hệ thống</p>
          </div>

          <button type="button" className="section-more" onClick={() => navigate('/book')}>
            Xem thêm
          </button>
        </div>

        <Spin
          spinning={isLoading}
          indicator={<LoadingOutlined className="homepage-loading-icon" spin />}
        >
          {!isLoading && listBook.length === 0 ? (
            <Empty description="Chưa có sách để hiển thị" />
          ) : (
            <Row gutter={[8, 8]} className="homepage-product-grid">
              {listBook.map((book) => {
                const inCart = carts.some((item) => item.bookId?._id === book._id);

                return (
                  <Col xs={12} sm={12} md={8} lg={6} xl={6} key={book._id}>
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
                      </div>

                      <div className="book-card-shopee__info">
                        <div className="book-card-shopee__title" title={book.mainText}>
                          {book.mainText}
                        </div>

                        <div className="book-card-shopee__author">Tác giả: {book.author}</div>

                        <div className="book-card-shopee__sold">
                          {(book.sold ?? 0) > 0 ? `Đã bán ${book.sold}` : 'Chưa có lượt bán'}
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
