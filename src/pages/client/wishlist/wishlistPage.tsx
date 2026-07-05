import React from 'react';
import { Row, Col, Button, Empty, message, Spin, Breadcrumb } from 'antd';
import {
  HeartFilled,
  ShoppingCartOutlined,
  HomeOutlined,
  LoadingOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context';
import { addItemToCartAPI, removeBookFromWishlistAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './wishlist.scss';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { wishlistItems, setWishlistItems, setWishlistBookIds, isWishlistLoading, setCarts } =
    useCurrentApp();

  const handleRemoveFavorite = async (bookId: string) => {
    try {
      const res = await removeBookFromWishlistAPI(bookId);
      if (res && res.data) {
        setWishlistItems(res.data.bookIds || []);
        setWishlistBookIds((res.data.bookIds || []).map((item: any) => item._id));
        message.success('Đã xóa khỏi danh sách yêu thích!');
      }
    } catch (error) {
      message.error('Không thể xóa sản phẩm. Vui lòng thử lại sau!');
    }
  };

  const handleAddToCart = async (book: IBookTable) => {
    try {
      const res = await addItemToCartAPI(book._id, 1);
      if (res?.data) {
        setCarts(res.data.items || []);
        message.success(`Đã thêm "${book.mainText}" vào giỏ hàng!`);
      }
    } catch (error) {
      message.error('Lỗi khi thêm vào giỏ hàng!');
    }
  };

  return (
    <div
      className="wishlist-page-container"
      style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}
    >
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item>
          <Link to="/">
            <HomeOutlined /> Trang chủ
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Danh sách yêu thích</Breadcrumb.Item>
      </Breadcrumb>

      <div className="wishlist-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600 }}>
          <HeartFilled style={{ color: '#ff4d4f', marginRight: '10px' }} />
          Sách bạn yêu thích ({wishlistItems.length})
        </h2>
      </div>

      <Spin
        spinning={isWishlistLoading}
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      >
        {wishlistItems.length === 0 ? (
          <div style={{ padding: '60px 0' }}>
            <Empty
              description="Danh sách yêu thích của bạn đang trống"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={() => navigate('/book')}>
                Tiếp tục khám phá sách
              </Button>
            </Empty>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {wishlistItems.map((book) => (
              <Col xs={24} sm={12} md={8} lg={6} key={book._id}>
                <div
                  className="wishlist-card"
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  <div
                    style={{ position: 'relative', height: '220px', cursor: 'pointer' }}
                    onClick={() => navigate(`/book/${book._id}`)}
                  >
                    <img
                      src={getBookImageUrl(book.thumbnail)}
                      alt={book.mainText}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '15px' }}>
                    <h4
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        height: '40px',
                        overflow: 'hidden',
                      }}
                    >
                      {book.mainText}
                    </h4>
                    <p
                      style={{
                        color: '#ff4d4f',
                        fontSize: '16px',
                        fontWeight: 700,
                        margin: '10px 0',
                      }}
                    >
                      {formatCurrency(book.price)}
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 40px',
                        gap: '8px',
                        marginTop: '15px',
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<ShoppingCartOutlined />}
                        block
                        onClick={() => handleAddToCart(book)}
                      >
                        Thêm vào giỏ
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveFavorite(book._id)}
                        title="Xóa khỏi yêu thích"
                      />
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default WishlistPage;
