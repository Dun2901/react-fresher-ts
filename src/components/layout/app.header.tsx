import { useState, useEffect, useRef } from 'react';
import {
  DashboardOutlined,
  DownOutlined,
  HistoryOutlined,
  LogoutOutlined,
  ReadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { FiShoppingCart } from 'react-icons/fi';
import { Divider, Badge, Drawer, Avatar, Input, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import './app.header.scss';
import { useCurrentApp } from 'components/context/app.context';
import { logoutAPI } from '@/services/api';
import { getAvatarUrl } from '@/services/helper';
import UserNotificationBell from '../notification/user.notification.bell';

const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);

  const { isAuthenticated, user, setUser, setIsAuthenticated, carts } = useCurrentApp();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    if (location.pathname !== '/book') {
      setSearchValue('');
    } else {
      setSearchValue(searchParams.get('search') || '');
    }
  }, [location.pathname, searchParams]);

  const handleSearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      navigate(`/book?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/book');
    }
  };

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

  const userMenuItems: MenuProps['items'] = [];

  if (user?.role === 'ADMIN') {
    userMenuItems.push({
      label: 'Trang quản trị',
      key: 'admin',
      icon: <DashboardOutlined />,
    });

    userMenuItems.push({
      type: 'divider',
    });
  }

  userMenuItems.push(
    {
      label: 'Quản lý tài khoản',
      key: 'account',
      icon: <UserOutlined />,
    },
    {
      label: 'Đơn hàng của tôi',
      key: 'orders',
      icon: <ShoppingOutlined />,
    },
    {
      label: 'Lịch sử mua hàng',
      key: 'order-history',
      icon: <HistoryOutlined />,
    },
    {
      type: 'divider',
    },
    {
      label: 'Đăng xuất',
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  );

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'admin') {
      navigate('/admin');
      return;
    }

    if (key === 'account') {
      navigate('/profile');
      return;
    }

    if (key === 'orders') {
      navigate('/orders');
      return;
    }

    if (key === 'order-history') {
      navigate('/orders/history');
      return;
    }

    if (key === 'logout') {
      void handleLogout();
    }
  };

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
            <Dropdown
              open={isSearchFocused}
              onOpenChange={(flag) => setIsSearchFocused(flag)}
              overlayStyle={{ width: '100%' }}
              getPopupContainer={(triggerNode) => triggerNode}
              dropdownRender={() => (
                <div
                  className="search-suggestions-dropdown"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    padding: '16px',
                    border: '1px solid #f0f0f0',
                    width: '100%',
                  }}
                >
                  <div style={{ marginBottom: '14px' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8c8c8c',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      🔥 Tìm kiếm phổ biến
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}
>
                      {['Alice', 'Du lịch', 'Treasure Island', 'Lịch sử', 'Kinh tế', 'Tư duy'].map(
                        (item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setSearchValue(item);
                              handleSearch(item);
                              setIsSearchFocused(false);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              border: '1px solid #f0f0f0',
                              background: '#fafafa',
                              fontSize: '11.5px',
                              color: '#434343',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                              e.currentTarget.style.color = 'var(--color-primary)';
                              e.currentTarget.style.background = 'var(--color-primary-soft)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#f0f0f0';
                              e.currentTarget.style.color = '#434343';
                              e.currentTarget.style.background = '#fafafa';
                            }}
                          >
                            {item}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8c8c8c',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      📚 Thể loại nổi bật
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}
>
                      {['Văn học', 'Kinh tế', 'Kỹ năng sống', 'Thiếu nhi', 'Lịch sử'].map(
                        (categoryName) => (
                          <button
                            key={categoryName}
                            type="button"
                            onClick={() => {
                              setSearchValue(categoryName);
                              handleSearch(categoryName);
                              setIsSearchFocused(false);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              border: '1px solid #f0f0f0',
                              background: '#fafafa',
                              fontSize: '11.5px',
                              color: '#434343',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-primary)';
                              e.currentTarget.style.color = 'var(--color-primary)';
                              e.currentTarget.style.background = 'var(--color-primary-soft)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#f0f0f0';
                              e.currentTarget.style.color = '#434343';
                              e.currentTarget.style.background = '#fafafa';
                            }}
                          >
                            {categoryName}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
              trigger={['click']}
              placement="bottomLeft"
            >
              <div style={{ width: '100%', position: 'relative' }}>
                <Input
                  className="search-bar-input"
                  placeholder="Bạn tìm sách gì hôm nay..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: '16px' }} />}
                  allowClear
                  value={searchValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchValue(val);
                    if (!val) {
                      navigate('/book');
                    }
                  }}
                  onPressEnter={(e) => {
                    handleSearch((e.target as HTMLInputElement).value);
                    setIsSearchFocused(false);
                  }}
                />
              </div>
            </Dropdown>
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

              <UserNotificationBell />

              <Divider type="vertical" className="desktop-divider" />

              <div className="action-item-user">
                {!isAuthenticated ? (
                  <span className="login-trigger-text" onClick={() => navigate('/login')}>
                    Tài Khoản
                  </span>
                ) : (
                  <Dropdown
                    menu={{
                      items: userMenuItems,
                      onClick: handleUserMenuClick,
                    }}
                    trigger={['click']}
                    placement="bottomRight"
                    overlayClassName="user-dropdown-overlay"
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  >
                    <button className="user-profile-dropdown" type="button">
                      <Avatar
                        className="user-profile-avatar"
                        src={<img src={getAvatarUrl(user?.avatar)} referrerPolicy="no-referrer" />}
                        icon={<UserOutlined />}
                      />

                      <span className="user-display-name">{user?.fullName || 'Tài khoản'}</span>

                      <DownOutlined className="user-dropdown-arrow" />
                    </button>
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
        {isAuthenticated && (
          <>
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
          </>
        )}

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
            className="drawer-nav-item drawer-nav-item--login"
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
