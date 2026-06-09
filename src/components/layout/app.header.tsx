import { useState } from 'react';
import { ReadOutlined } from '@ant-design/icons';
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
  const [openCartPopover, setOpenCartPopover] = useState(false);
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
      label: <Link to="/profile">Quản lý tài khoản</Link>,
      key: 'account',
    },
    {
      label: <Link to="/orders">Đơn hàng của tôi</Link>,
      key: 'orders',
    },
    {
      label: <Link to="/orders/history">Lịch sử mua hàng</Link>,
      key: 'order-history',
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

  const contentPopover = () => (
    <div className="pop-cart-body">
      <div className="pop-cart-content">
        {carts?.map((item, index) => (
          <div className="pop-cart-book" key={`pop-book-${index}`}>
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${item?.bookId?.thumbnail}`}
              className="pop-cart-book__img"
              alt={item?.bookId?.mainText}
            />
            <div className="pop-cart-book__name">{item?.bookId?.mainText}</div>
            <div className="pop-cart-book__price">{formatCurrency(item?.priceAtAdd ?? 0)}</div>
          </div>
        ))}
      </div>
      {carts && carts.length > 0 ? (
        <div className="pop-cart-footer">
          <button
            className="pop-cart-footer__btn"
            onClick={() => {
              setOpenCartPopover(false);
              navigate('/cart');
            }}
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
          {/* KHỐI TRÁI */}
          <div className="navbar-left">
            <div className="navbar-toggle-btn" onClick={() => setOpenDrawer(true)}>
              ☰
            </div>
            <div className="logo-brand" onClick={() => navigate('/')}>
              <ReadOutlined className="icon-book" />
              <span className="logo-brand-text">BookStore</span>
            </div>
          </div>

          {/* KHỐI GIỮA */}
          <div className="navbar-center">
            <Input
              className="search-bar-input"
              placeholder="Bạn tìm sách gì hôm nay..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: '16px' }} />}
              allowClear
            />
          </div>

          {/* KHỐI PHẢI */}
          <div className="navbar-right">
            <nav className="navigation-actions">
              <div className="action-item-cart">
                <Popover
                  placement="bottomRight"
                  title={<span style={{ fontWeight: 600 }}>Sản phẩm mới thêm</span>}
                  content={contentPopover}
                  arrow={true}
                  trigger="click"
                  open={openCartPopover}
                  onOpenChange={setOpenCartPopover}
                >
                  <Badge
                    count={carts?.length ?? 0}
                    size="small"
                    showZero
                    style={{ cursor: 'pointer' }}
                  >
                    <FiShoppingCart className="icon-cart-svg" />
                  </Badge>
                </Popover>
              </div>

              <Divider type="vertical" className="desktop-divider" />

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

      {/* Drawer menu mobile */}
      <Drawer
        title="Danh mục chức năng"
        placement="left"
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        <p
          className="drawer-nav-item"
          onClick={() => {
            navigate('/');
            setOpenDrawer(false);
          }}
        >
          Trang chủ
        </p>
        <Divider className="drawer-divider" />

        <p
          className="drawer-nav-item"
          onClick={() => {
            navigate('/profile');
            setOpenDrawer(false);
          }}
        >
          Quản lý tài khoản
        </p>
        <Divider className="drawer-divider" />

        <p
          className="drawer-nav-item"
          onClick={() => {
            navigate('/orders');
            setOpenDrawer(false);
          }}
        >
          Đơn hàng của tôi
        </p>
        <Divider className="drawer-divider" />

        <p
          className="drawer-nav-item"
          onClick={() => {
            navigate('/orders/history');
            setOpenDrawer(false);
          }}
        >
          Lịch sử mua hàng
        </p>
        <Divider className="drawer-divider" />

        {user?.role === 'ADMIN' && (
          <>
            <p
              className="drawer-nav-item drawer-nav-item--admin"
              onClick={() => {
                navigate('/admin');
                setOpenDrawer(false);
              }}
            >
              Trang quản trị Admin
            </p>
            <Divider className="drawer-divider" />
          </>
        )}

        <p className="drawer-nav-item drawer-nav-item--logout" onClick={handleLogout}>
          Đăng xuất
        </p>
      </Drawer>
    </>
  );
};

export default AppHeader;
