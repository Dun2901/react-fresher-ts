import { useState } from 'react';
import {
  DashboardOutlined,
  HistoryOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ReadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { FiShoppingCart } from 'react-icons/fi';
import {
  App,
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Popover,
  Space,
} from 'antd';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context';
import { logoutAPI } from '@/services/api';
import { formatCurrency, getAvatarUrl } from '@/services/helper';
import './app.header.scss';

const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openCartPopover, setOpenCartPopover] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { message } = App.useApp();

  const { isAuthenticated, user, setUser, setIsAuthenticated, carts, setCarts } = useCurrentApp();

  const navigate = useNavigate();

  const showLoginRequiredMessage = () => {
    message.warning('Vui lòng đăng nhập để sử dụng chức năng này.');
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCarts([]);
    localStorage.removeItem('access_token');
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logoutAPI();
    } finally {
      clearAuthState();
      setOpenDrawer(false);
      setOpenCartPopover(false);
      setIsLoggingOut(false);
      message.success('Đăng xuất thành công');
      navigate('/');
    }
  };

  const handleCartOpenChange = (open: boolean) => {
    if (!isAuthenticated) {
      setOpenCartPopover(false);

      if (open) {
        showLoginRequiredMessage();
      }

      return;
    }

    setOpenCartPopover(open);
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
        <span onClick={handleLogout} style={{ cursor: 'pointer', color: '#ff4d4f' }}>
          {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
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
          <div className="navbar-left">
            <button
              type="button"
              className="navbar-toggle-btn"
              onClick={() => setOpenDrawer(true)}
              aria-label="Mở menu"
            >
              ☰
            </button>

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
              <div className="action-item-cart">
                <Popover
                  placement="bottomRight"
                  title={<span style={{ fontWeight: 600 }}>Sản phẩm mới thêm</span>}
                  content={contentPopover}
                  arrow
                  trigger="click"
                  open={isAuthenticated ? openCartPopover : false}
                  onOpenChange={handleCartOpenChange}
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
                  <>
                    <span className="login-trigger-text" onClick={() => navigate('/login')}>
                      Tài khoản
                    </span>

                    <button
                      type="button"
                      className="mobile-account-btn mobile-account-btn--login"
                      onClick={() => setOpenDrawer(true)}
                      aria-label="Tài khoản"
                    >
                      <UserOutlined />
                    </button>
                  </>
                ) : (
                  <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    placement="bottomRight"
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  >
                    <Space className="user-profile-dropdown">
                      <Avatar src={getAvatarUrl(user?.avatar)} icon={<UserOutlined />} />
                      <span className="user-display-name">{user?.fullName}</span>
                    </Space>
                  </Dropdown>
                )}
              </div>
            </nav>
          </div>
        </header>

        {!isAuthenticated && (
          <div className="mobile-login-hint">
            <div className="mobile-login-hint__text">
              <UserOutlined />
              <span>Bạn chưa đăng nhập</span>
            </div>

            <button type="button" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>
        )}
      </div>

      <Drawer
        title="Danh mục chức năng"
        placement="left"
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
        width={340}
        className="mobile-nav-drawer"
      >
        {!isAuthenticated ? (
          <div className="drawer-auth-card">
            <div className="drawer-auth-card__icon">
              <UserOutlined />
            </div>

            <div className="drawer-auth-card__content">
              <h3>Bạn chưa đăng nhập</h3>
              <p>Đăng nhập để xem giỏ hàng, đơn hàng và lịch sử mua hàng của bạn.</p>
            </div>

            <Button
              type="primary"
              icon={<LoginOutlined />}
              block
              className="drawer-auth-card__btn"
              onClick={() => {
                setOpenDrawer(false);
                navigate('/login');
              }}
            >
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <div className="drawer-user-card">
            <Avatar size={46} src={getAvatarUrl(user?.avatar)} icon={<UserOutlined />} />

            <div className="drawer-user-card__info">
              <h3>{user?.fullName}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
        )}

        <div className="drawer-nav-list">
          <p
            className="drawer-nav-item"
            onClick={() => {
              navigate('/');
              setOpenDrawer(false);
            }}
          >
            <HomeOutlined />
            <span>Trang chủ</span>
          </p>

          <Divider className="drawer-divider" />

          {!isAuthenticated ? (
            <>
              <p
                className="drawer-nav-item drawer-nav-item--login"
                onClick={() => {
                  setOpenDrawer(false);
                  navigate('/login');
                }}
              >
                <LoginOutlined />
                <span>Đăng nhập</span>
              </p>

              <Divider className="drawer-divider" />
            </>
          ) : (
            <>
              <p
                className="drawer-nav-item"
                onClick={() => {
                  navigate('/profile');
                  setOpenDrawer(false);
                }}
              >
                <ProfileOutlined />
                <span>Quản lý tài khoản</span>
              </p>

              <Divider className="drawer-divider" />

              <p
                className="drawer-nav-item"
                onClick={() => {
                  navigate('/orders');
                  setOpenDrawer(false);
                }}
              >
                <ShoppingOutlined />
                <span>Đơn hàng của tôi</span>
              </p>

              <Divider className="drawer-divider" />

              <p
                className="drawer-nav-item"
                onClick={() => {
                  navigate('/orders/history');
                  setOpenDrawer(false);
                }}
              >
                <HistoryOutlined />
                <span>Lịch sử mua hàng</span>
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
                    <DashboardOutlined />
                    <span>Trang quản trị Admin</span>
                  </p>

                  <Divider className="drawer-divider" />
                </>
              )}

              <p className="drawer-nav-item drawer-nav-item--logout" onClick={handleLogout}>
                <LogoutOutlined />
                <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
              </p>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default AppHeader;
