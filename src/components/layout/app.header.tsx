import { useState } from 'react';
import { FaReact } from 'react-icons/fa';
import { FiShoppingCart } from 'react-icons/fi';
import { SearchOutlined } from '@ant-design/icons';
import { Divider, Badge, Drawer, Avatar, Popover, Empty, Input, Dropdown, Space } from 'antd';
import { useNavigate } from 'react-router';
import './app.header.scss';
import { Link } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context';
import { logoutAPI } from '@/services/api';
import { getAvatarUrl, formatCurrency } from '@/services/helper';

const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const { isAuthenticated, user, setUser, setIsAuthenticated, carts } = useCurrentApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const res = await logoutAPI();
    if (res.data) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
    }
  };

  const items = [
    {
      label: (
        <span onClick={() => alert('me')} style={{ cursor: 'pointer' }}>
          Quản lý tài khoản
        </span>
      ),
      key: 'account',
    },
    {
      label: <Link to="/orders">Lịch sử mua hàng</Link>,
      key: 'history',
    },
    {
      label: (
        <span onClick={handleLogout} style={{ cursor: 'pointer' }}>
          Đăng xuất
        </span>
      ),
      key: 'logout',
    },
  ];

  if (user?.role === 'ADMIN') {
    items.unshift({
      label: <Link to="/admin">Trang quản trị</Link>,
      key: 'admin',
    });
  }

  // Giao diện thu gọn danh sách giỏ hàng khi rê chuột vào icon Cart
  const contentPopover = () => (
    <div className="pop-cart-body">
      <div className="pop-cart-content" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {carts?.map((item, index) => (
          <div
            className="book"
            key={`pop-book-${index}`}
            style={{
              display: 'flex',
              padding: '8px 0',
              alignItems: 'center',
              gap: '12px',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${item?.bookId?.thumbnail}`}
              style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }}
              alt={item?.bookId?.mainText}
            />
            <div
              style={{
                flex: 1,
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '13px',
              }}
            >
              {item?.bookId?.mainText}
            </div>
            <div className="price" style={{ color: '#ff4d4f', fontWeight: '600' }}>
              {formatCurrency(item?.priceAtAdd ?? 0)}
            </div>
          </div>
        ))}
      </div>
      {carts && carts.length > 0 ? (
        <div className="pop-cart-footer" style={{ marginTop: '12px', textAlign: 'right' }}>
          <button
            style={{
              background: '#1677ff',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            onClick={() => navigate('/cart')}
          >
            Xem giỏ hàng
          </button>
        </div>
      ) : (
        <Empty description="Không có sản phẩm trong giỏ hàng" />
      )}
    </div>
  );

  return (
    <>
      <div className="header-container-premium">
        <header className="page-header-navbar">
          {/* KHỐI TRÁI: LOGO & MENU MOBILE */}
          <div className="navbar-left">
            <div className="navbar-toggle-btn" onClick={() => setOpenDrawer(true)}>
              ☰
            </div>
            <div className="logo-brand" onClick={() => navigate('/')}>
              <FaReact className="rotate icon-react" />
              <span className="logo-brand-text">Hỏi Dân !T</span>
            </div>
          </div>

          {/* KHỐI GIỮA: THANH TÌM KIẾM ĐÃ FIX LỆCH ICON */}
          <div className="navbar-center">
            <Input
              className="search-bar-input"
              placeholder="Bạn tìm gì hôm nay..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: '16px' }} />}
              allowClear
            />
          </div>

          {/* KHỐI PHẢI: GIỎ HÀNG & USER ACCOUNT */}
          <div className="navbar-right">
            <nav className="navigation-actions">
              {/* Giỏ hàng */}
              <div className="action-item-cart">
                <Popover
                  placement="bottomRight"
                  title={<span style={{ fontWeight: 600 }}>Sản phẩm mới thêm</span>}
                  content={contentPopover}
                  arrow={true}
                >
                  <Badge
                    count={carts?.length ?? 0}
                    size={'small'}
                    showZero
                    style={{ cursor: 'pointer' }}
                  >
                    <FiShoppingCart className="icon-cart-svg" onClick={() => navigate('/cart')} />
                  </Badge>
                </Popover>
              </div>

              <Divider type="vertical" className="desktop-divider" />

              {/* Thông tin tài khoản */}
              <div className="action-item-user">
                {!isAuthenticated ? (
                  <span className="login-trigger-text" onClick={() => navigate('/login')}>
                    Tài Khoản
                  </span>
                ) : (
                  <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    placement="bottomRight"
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  >
                    <Space className="user-profile-dropdown" style={{ cursor: 'pointer' }}>
                      <Avatar src={getAvatarUrl(user?.avatar)} />
                      <span className="user-display-name">{user?.fullName}</span>
                    </Space>
                  </Dropdown>
                )}
              </div>
            </nav>
          </div>
        </header>
      </div>

      {/* Drawer menu cho thiết bị di động */}
      <Drawer
        title="Danh mục chức năng"
        placement="left"
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        <p
          style={{ padding: '8px 0', cursor: 'pointer' }}
          onClick={() => {
            navigate('/');
            setOpenDrawer(false);
          }}
        >
          Trang chủ
        </p>
        <Divider style={{ margin: '8px 0' }} />
        <p
          style={{ padding: '8px 0', cursor: 'pointer' }}
          onClick={() => {
            navigate('/orders');
            setOpenDrawer(false);
          }}
        >
          Lịch sử mua hàng
        </p>
        <Divider style={{ margin: '8px 0' }} />
        {user?.role === 'ADMIN' && (
          <>
            <p
              style={{ padding: '8px 0', cursor: 'pointer', color: '#1677ff' }}
              onClick={() => {
                navigate('/admin');
                setOpenDrawer(false);
              }}
            >
              Trang quản trị Admin
            </p>
            <Divider style={{ margin: '8px 0' }} />
          </>
        )}
        <p
          onClick={handleLogout}
          style={{ padding: '8px 0', color: '#ff4d4f', cursor: 'pointer', fontWeight: 600 }}
        >
          Đăng xuất
        </p>
      </Drawer>
    </>
  );
};

export default AppHeader;
