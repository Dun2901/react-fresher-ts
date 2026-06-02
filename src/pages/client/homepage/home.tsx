import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tooltip,
  message,
  Space,
  Spin,
  Pagination,
  Carousel,
  Layout,
  Checkbox,
  Slider,
  Rate,
  Divider,
  Badge,
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  LoadingOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useCurrentApp } from 'components/context/app.context.tsx';
import './home.scss';
import { addItemToCartAPI, getBooksAPI } from '@/services/api.ts';
import axios from 'axios';

const { Sider, Content } = Layout;

const Homepage: React.FC = () => {
  const { carts, setCarts } = useCurrentApp();
  const [listBook, setListBook] = useState<IBookTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Quản lý trạng thái phân trang
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [total, setTotal] = useState<number>(0);

  // Trạng thái bộ lọc tìm kiếm thực tế (Dùng tối ưu giao diện Frontend)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);
      try {
        // Tạo query string cơ bản từ hệ thống
        const query = `current=${current}&pageSize=${pageSize}&sort=-createdAt`;
        const res = await getBooksAPI(query);
        if (res && res.data) {
          setListBook(res.data.result || []);
          setTotal(res.data.meta.total || 0);
        }
      } catch (error) {
        message.error('Không thể kết nối với cơ sở dữ liệu');
        console.error('Lỗi hệ thống:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBooks();
  }, [current, pageSize]);

  const handlePaginationChange = (page: number, pSize: number) => {
    setCurrent(page);
    if (pSize !== pageSize) {
      setPageSize(pSize);
      setCurrent(1);
    }
  };

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

  // Danh mục giả lập phổ biến để hiển thị thanh bộ lọc giống Tiki/Fahasa
  const categoriesOptions = [
    { label: 'Sách Công Nghệ', value: 'Tech' },
    { label: 'Sách Kinh Tế - Kỹ Năng', value: 'Business' },
    { label: 'Văn Học & Tiểu Thuyết', value: 'Literature' },
    { label: 'Truyện Tranh & Manga', value: 'Comic' },
  ];

  return (
    <div className="homepage-shop">
      {/* 1. CAROUSEL BANNER KHUYẾN MÃI TRƯỢT TỰ ĐỘNG */}
      <Carousel autoplay effect="fade" className="shop-carousel">
        <div>
          <div className="banner-slide slide-1">
            <div className="banner-inner">
              <span className="badge-promo">ƯU ĐÃI ĐỘC QUYỀN</span>
              <h1>Hội Sách Công Nghệ & Khởi Nghiệp</h1>
              <p>
                Đồng loạt giảm đến 35% cho toàn bộ các đầu sách chuyên ngành lập trình Web, AI và Kỹ
                năng mềm tuần này!
              </p>
              <Button type="primary" size="large" danger>
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
              <p>
                Tặng ngay mã giảm giá 50.000 VNĐ cho hóa đơn mua sách từ 350.000 VNĐ áp dụng toàn
                quốc.
              </p>
              <Button
                type="primary"
                size="large"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Khám Phá
              </Button>
            </div>
          </div>
        </div>
      </Carousel>

      {/* 2. BỐ CỤC LAYOUT CHÍNH CHIA LÀM SIDEBAR FILTER + DANH SÁCH */}
      <Layout className="shop-main-layout" style={{ background: 'transparent', marginTop: 30 }}>
        {/* THANH BỘ LỌC (SIDEBAR) BÊN TRÁI */}
        <Sider
          width={260}
          className="shop-sidebar-filter"
          breakpoint="lg"
          collapsedWidth="0"
          trigger={null}
        >
          <div className="filter-header">
            <FilterOutlined /> <span>BỘ LỌC TÌM KIẾM</span>
          </div>
          <Divider style={{ margin: '12px 0' }} />

          {/* Bộ lọc theo Danh mục */}
          <div className="filter-group">
            <h4>Danh Mục Sản Phẩm</h4>
            <Checkbox.Group
              options={categoriesOptions}
              value={selectedCategories}
              onChange={(checkedValues) => setSelectedCategories(checkedValues as string[])}
              className="vertical-checkbox-group"
            />
          </div>
          <Divider style={{ margin: '16px 0' }} />

          {/* Bộ lọc theo giá (Thanh trượt thông minh) */}
          <div className="filter-group">
            <h4>Khoảng Giá (VNĐ)</h4>
            <Slider
              range
              min={0}
              max={500000}
              step={10000}
              value={priceRange}
              onChange={(value) => setPriceRange(value as [number, number])}
              tooltip={{ formatter: (v) => `${v?.toLocaleString('vi-VN')}đ` }}
            />
            <div className="price-range-label">
              <span>{priceRange[0].toLocaleString('vi-VN')}đ</span>
              <span>-</span>
              <span>{priceRange[1].toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
          <Divider style={{ margin: '16px 0' }} />

          {/* Bộ lọc theo số sao đánh giá */}
          <div className="filter-group">
            <h4>Đánh Giá Từ Khách Hàng</h4>
            <div className="rating-filter-item">
              <Rate disabled defaultValue={5} style={{ fontSize: 13 }} /> <span>(Từ 5 sao)</span>
            </div>
            <div className="rating-filter-item">
              <Rate disabled defaultValue={4} style={{ fontSize: 13 }} /> <span>(Từ 4 sao)</span>
            </div>
            <div className="rating-filter-item">
              <Rate disabled defaultValue={3} style={{ fontSize: 13 }} /> <span>(Từ 3 sao)</span>
            </div>
          </div>
        </Sider>

        {/* DANH SÁCH CARD SÁCH BÊN PHẢI */}
        <Content className="shop-content-products">
          <div className="content-title-wrapper">
            <h2 className="section-title">Danh sách sách mới nhất</h2>
          </div>

          <Spin spinning={isLoading} indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />}>
            <Row gutter={[16, 20]}>
              {listBook.map((book, index) => {
                // Tính toán các thông số giả lập để hiển thị UI thực tế sinh động
                const hasDiscount = index % 2 === 0;
                const discountPercent = hasDiscount ? (index % 4 === 0 ? 25 : 15) : 0;
                const fakeSold = Math.floor((book.price % 149) + 21); // Tạo số lượng đã bán ngẫu nhiên nhìn cho thật
                const fakeRate = index % 3 === 0 ? 5 : 4.5;

                const innerCard = (
                  <Card
                    className="book-card-premium"
                    hoverable
                    bodyStyle={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                    cover={
                      <div className="book-image-container">
                        <img
                          alt={book.mainText}
                          src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${book.thumbnail}`}
                          onError={(e) => {
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';
                          }}
                        />
                      </div>
                    }
                  >
                    <div className="book-meta-data">
                      <div className="book-title-text" title={book.mainText}>
                        {book.mainText}
                      </div>
                      <div className="book-author-text">Tác giả: {book.author}</div>

                      {/* Phần sao & Đã bán */}
                      <div className="book-rating-sold">
                        <Rate disabled allowHalf defaultValue={fakeRate} style={{ fontSize: 10 }} />
                        <span className="sold-count">Đã bán {fakeSold}</span>
                      </div>

                      {/* Khối bọc chân card để đẩy thẳng hàng xuống đáy */}
                      <div className="book-card-footer">
                        <div className="price-section">
                          <span className="current-price">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(book.price)}
                          </span>
                          {discountPercent > 0 && (
                            <span className="old-price">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(book.price * (1 + discountPercent / 100))}
                            </span>
                          )}
                        </div>

                        <div className="action-buttons">
                          <Tooltip title="Xem chi tiết">
                            <Button className="btn-view" shape="circle" icon={<EyeOutlined />} />
                          </Tooltip>
                          <Button
                            type="primary"
                            className={`btn-action-cart ${carts.some((item) => item.bookId._id === book._id) ? 'btn-buy-more' : ''}`}
                            danger={carts.some((item) => item.bookId._id === book._id)}
                            icon={<ShoppingCartOutlined />}
                            onClick={() => handleAddToCart(book)}
                          >
                            {carts.some((item) => item.bookId._id === book._id)
                              ? 'Mua tiếp'
                              : 'Mua'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );

                return (
                  <Col xs={24} sm={12} md={12} lg={8} xl={6} key={book._id}>
                    {discountPercent > 0 ? (
                      <Badge.Ribbon
                        text={`-${discountPercent}%`}
                        color="red"
                        className="discount-ribbon"
                      >
                        {innerCard}
                      </Badge.Ribbon>
                    ) : (
                      innerCard
                    )}
                  </Col>
                );
              })}
            </Row>

            {/* Thanh điều hướng phân trang */}
            {listBook.length > 0 && (
              <Row style={{ marginTop: 36, justifyContent: 'center' }}>
                <Pagination
                  current={current}
                  pageSize={pageSize}
                  total={total}
                  responsive={true}
                  showSizeChanger={true}
                  pageSizeOptions={['4', '8', '12', '16']}
                  onChange={handlePaginationChange}
                  showTotal={(total) => `Hiển thị ${listBook.length}/${total} cuốn sách`}
                />
              </Row>
            )}
          </Spin>
        </Content>
      </Layout>
    </div>
  );
};

export default Homepage;
