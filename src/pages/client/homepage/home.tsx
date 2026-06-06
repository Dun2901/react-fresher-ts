import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tooltip,
  message,
  Spin,
  Carousel,
  Badge,
  Rate
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  LoadingOutlined,
  ArrowRightOutlined
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


  const pageSize = 8;

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        // Gọi API lấy đúng 8 cuốn sách mới nhất được tạo dựa trên sort=-createdAt
        const query = `current=1&pageSize=${pageSize}&sort=-createdAt`;
        const res = await getBooksAPI(query);
        if (res && res.data) {
          setListBook(res.data.result || []);
        }
      } catch (error) {
        message.error('Không thể kết nối với cơ sở dữ liệu');
        console.error('Lỗi hệ thống:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, []); //

  const handleAddToCart = async (book: IBookTable) => {
    try {
      const res = await addItemToCartAPI(book._id, 1);
      if (res && res.data) {
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
        {/* banner */}
        <Carousel autoplay effect="fade" className="shop-carousel">
          <div>
            <div className="banner-slide slide-1">
              <div className="banner-inner">
                <span className="badge-promo">ƯU ĐÃI ĐỘC QUYỀN</span>
                <h1>Hội Sách Công Nghệ & Khởi Nghiệp</h1>
                <p>Đồng loạt giảm đến 35% cho toàn bộ các đầu sách chuyên ngành lập trình Web, AI tuần này!</p>
                <Button type="primary" size="large" danger onClick={() => navigate('/book')}>
                  Mua Ngay
                </Button>
              </div>
            </div>
          </div>
          <div>
            <div className="banner-slide slide-2">
              <div className="banner-inner">
                <span className="badge-promo">BEST SELLER</span>
                <h1>Sách Hay Thay Đổi Tư Duy</h1>
                <p>Tặng ngay mã giảm giá 50.000 VNĐ cho hóa đơn mua sách từ 350.000 VNĐ áp dụng toàn quốc.</p>
                <Button type="primary" size="large" style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={() => navigate('/book')}>
                  Khám Phá
                </Button>
              </div>
            </div>
          </div>
        </Carousel>

        <div className="homepage-products-section">
          <div className="content-title-wrapper">
            <h2 className="section-title">Sách Mới Nổi Bật</h2>
            <p className="section-subtitle">Khám phá ngay những tựa sách mới nhất vừa cập bến tuần này</p>
          </div>

          <Spin spinning={isLoading} indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />}>
            <Row gutter={[16, 20]}>
              {listBook.map((book, index) => {
                const hasDiscount = index % 2 === 0;
                const discountPercent = hasDiscount ? (index % 4 === 0 ? 25 : 15) : 0;
                const fakeSold = Math.floor((book.price % 149) + 21);
                const fakeRate = index % 3 === 0 ? 5 : 4.5;

                const innerCard = (
                    <Card
                        className="book-card-premium"
                        hoverable
                        styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                        cover={
                          <div className="book-image-container">
                            <img
                                alt={book.mainText}
                                src={getBookImageUrl(book.thumbnail)}
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';
                                }}
                            />
                          </div>
                        }
                    >
                      <div className="book-meta-data">
                        <div className="book-title-text" title={book.mainText}>{book.mainText}</div>
                        <div className="book-author-text">Tác giả: {book.author}</div>

                        <div className="book-rating-sold">
                          <Rate disabled allowHalf defaultValue={fakeRate} style={{ fontSize: 10 }} />
                          <span className="sold-count">Đã bán {fakeSold}</span>
                        </div>

                        <div className="book-card-footer">
                          <div className="price-section">
                            <span className="current-price">{formatCurrency(book.price)}</span>
                            {discountPercent > 0 && (
                                <span className="old-price">{formatCurrency(book.price * (1 + discountPercent / 100))}</span>
                            )}
                          </div>

                          <div className="action-buttons">
                            <Tooltip title="Xem chi tiết">
                              <Button
                                  className="btn-view"
                                  shape="circle"
                                  icon={<EyeOutlined />}
                                  onClick={() => navigate(`/book/${book._id}`)} // Điều hướng đến chi tiết
                              />
                            </Tooltip>
                            <Button
                                type="primary"
                                className={`btn-action-cart ${carts.some((item) => item.bookId._id === book._id) ? 'btn-buy-more' : ''}`}
                                danger={carts.some((item) => item.bookId._id === book._id)}
                                icon={<ShoppingCartOutlined />}
                                onClick={() => handleAddToCart(book)}
                            >
                              {carts.some((item) => item.bookId._id === book._id) ? 'Mua tiếp' : 'Mua'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                );

                return (
                    <Col xs={24} sm={12} md={12} lg={8} xl={6} key={book._id}>
                      {discountPercent > 0 ? (
                          <Badge.Ribbon text={`-${discountPercent}%`} color="red" className="discount-ribbon">
                            {innerCard}
                          </Badge.Ribbon>
                      ) : (
                          innerCard
                      )}
                    </Col>
                );
              })}
            </Row>

            {/* nút xem tất cả để chuyển qua trang boo list */}
            {!isLoading && listBook.length > 0 && (
                <div className="view-all-container">
                  <Button
                      type="primary"
                      size="large"
                      className="btn-view-all"
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                      onClick={() => navigate('/book')}
                  >
                    Xem tất cả sản phẩm
                  </Button>
                </div>
            )}
          </Spin>
        </div>
      </div>
  );
};

export default Homepage;