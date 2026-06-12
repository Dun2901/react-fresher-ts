import { useState } from 'react';
import { ReadOutlined, SearchOutlined } from '@ant-design/icons';
import { FiShoppingCart } from 'react-icons/fi';
import { Divider, Badge, Drawer, Avatar, Input, Dropdown, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import './app.header.scss';
import { useCurrentApp } from 'components/context/app.context';
import { logoutAPI } from '@/services/api';
import { getAvatarUrl } from '@/services/helper';

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
      setOpenDrawer(false);
      navigate('/');
    }
  };

  const handleGoToCart = () => {
    navigate('/cart');
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

  return (
    <>
      <div className="header-container-premium">
        <header className="page-header-navbar">
          <div className="navbar-left">
            <div className="navbar-toggle-btn" onClick={() => setOpenDrawer(true)}>
              ☰
            </div>

            <div className="logo-brand" onClick={() => navigate('/')}>
              <ReadOutlined className="icon-book" />
              <span className="logo-brand-text">BookStore</span>
            </div>
          </div>

          <div className="navbar-center">
            <Input
              className="search-bar-input"
              placeholder="Bạn tìm sách gì hôm nay..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: '16px' }} />}
              allowClear
            />
          </div>

          <div className="navbar-right">
            <nav className="navigation-actions">
              <div className="action-item-cart" onClick={handleGoToCart}>
                <Badge
                  count={carts?.length ?? 0}
                  size="small"
                  showZero
                  style={{ cursor: 'pointer' }}
                >
                  <FiShoppingCart className="icon-cart-svg" />
                </Badge>
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

        {isAuthenticated ? (
          <p className="drawer-nav-item drawer-nav-item--logout" onClick={handleLogout}>
            Đăng xuất
          </p>
        ) : (
          <p
            className="drawer-nav-item"
            onClick={() => {
              navigate('/login');
              setOpenDrawer(false);
            }}
          >
            Đăng nhập
          </p>
        )}
      </Drawer>
    </>
  );
};

export default AppHeader;
