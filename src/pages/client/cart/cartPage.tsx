import React, { useState } from 'react';
import { Row, Col, InputNumber, Button, Divider, Empty, message, Card } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useCurrentApp } from 'components/context/app.context.tsx';
import { updateCartItemAPI, removeCartItemAPI } from '@/services/api.ts';
import { formatCurrency } from '@/services/helper';
import axios from 'axios';
import './cartPage.scss';
import { useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { carts, setCarts } = useCurrentApp();
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // xử lý thay đổi số lượng
  const handleQuantityChange = async (bookId: string, currentQty: number) => {
    if (currentQty < 1) return;

    setIsActionLoading(true);
    try {
      const res = await updateCartItemAPI(bookId, currentQty);
      if (res && res.data) {
        //cập nhật lại danh sách giỏ hàng mới từ DB trả về
        setCarts(res.data.items || []);
      }
    } catch (error) {
      let errorMsg = 'Không thể cập nhật số lượng!';
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      }
      message.error(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // xử lý xóa sản phẩm khỏi giỏ hàng
  const handleRemoveItem = async (bookId: string) => {
    setIsActionLoading(true);
    try {
      const res = await removeCartItemAPI(bookId);
      if (res && res.data) {
        setCarts(res.data.items || []);
        message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error('Không thể xóa sản phẩm!');
    } finally {
      setIsActionLoading(false);
    }
  };

  // tính tổng tiền trong giỏ
  const calculateTotalPrice = () => {
    return carts.reduce((total, item) => total + item.quantity * item.priceAtAdd, 0);
  };

  // hiển thị giỏ hàng trống
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginBottom: 15,
          flexWrap: 'wrap',
          gap: '350px',
        }}
      >
        <h2 className="order-title" style={{ marginBottom: 20 }}>
          <ShoppingCartOutlined /> Giỏ Hàng ({carts.length} sản phẩm)
        </h2>

        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ paddingRight: 0, color: '#3481ed', fontSize: 18, fontWeight: 600 }}
        >
          Tiếp tục mua sắm
        </Button>
      </div>

      <Row gutter={[20, 20]}>
        {/* ─── bên trái: danh sách sản phẩm─────────────────── */}
        <Col xs={24} lg={17}>
          <div className="cart-items-list">
            {carts.map((item) => (
              <Card
                key={item.bookId._id}
                className="cart-item-card"
                style={{ marginBottom: 15 }}
                bodyStyle={{ padding: '15px' }}
              >
                <Row align="middle" gutter={[16, 16]}>
                  {/* anh sản phẩm */}
                  <Col xs={6} sm={4} style={{ textAlign: 'center' }}>
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${item.bookId.thumbnail}`}
                      alt={item.bookId.mainText}
                      style={{ width: '100%', maxHeight: 90, objectFit: 'contain' }}
                    />
                  </Col>

                  {/* thông tin sản phẩm */}
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
                  </Col>

                  {/* nút tăng/giảm số lượng */}
                  <Col xs={12} sm={6} style={{ textAlign: 'center' }}>
                    <InputNumber
                      min={1}
                      max={item.bookId.quantity} //không cho tăng vượt quá tồn kho trong DB
                      value={item.quantity}
                      disabled={isActionLoading}
                      onChange={(value) => handleQuantityChange(item.bookId._id, value as number)}
                    />
                    <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 4 }}>
                      (Còn kho: {item.bookId.quantity})
                    </div>
                  </Col>

                  {/* thành tiền và nút xóa */}
                  <Col xs={12} sm={4} style={{ textAlign: 'right' }}>
                    <div
                      className="item-total-price"
                      style={{ fontWeight: 600, color: '#ff4d4f', marginBottom: 10 }}
                    >
                      {formatCurrency(item.quantity * item.priceAtAdd)}
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={isActionLoading}
                      onClick={() => handleRemoveItem(item.bookId._id)}
                    >
                      Xóa
                    </Button>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </Col>

        {/* ─── bên phải: phần tóm tắt đơn hàng────────────────── */}
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

            <Button
              type="primary"
              size="large"
              block
              style={{
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f',
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
