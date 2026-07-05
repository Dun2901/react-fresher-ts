import { useState, useEffect } from 'react';
import {
  DashboardOutlined,
  DownOutlined,
  HistoryOutlined,
  LogoutOutlined,
  ReadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,
  HeartOutlined,
  AudioOutlined,
  AudioMutedOutlined,
} from '@ant-design/icons';
import { FiShoppingCart } from 'react-icons/fi';
import { Divider, Badge, Drawer, Avatar, Input, Dropdown, Tooltip, message, Modal } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import './app.header.scss';
import { useCurrentApp } from 'components/context/app.context';
import { logoutAPI } from '@/services/api';
import { getAvatarUrl } from '@/services/helper';
import UserNotificationBell from '../notification/user.notification.bell';

const AppHeader = () => {
  const [openDrawer, setOpenDrawer] = useState(false);

  const { isAuthenticated, user, setUser, setIsAuthenticated, carts, wishlistBookIds } =
    useCurrentApp();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  //timf kiếm bằng giọng nói (Web Speech API)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const speechInstance = new SpeechRecognition();
      speechInstance.continuous = false;
      speechInstance.lang = 'vi-VN'; //nhận diện tiếng Việt
      speechInstance.interimResults = false;

      speechInstance.onresult = (event: any) => {
        const textResult = event.results[0][0].transcript;
        if (textResult) {
          const cleanedText = textResult.replace(/\.$/, '');
          setSearchValue(cleanedText);
          setIsSearchFocused(false);
          message.success(`Tìm kiếm: "${cleanedText}"`);

          // chuyển hướng sang trang danh sách sách với voice vừa nhận
          navigate(`/book?search=${encodeURIComponent(cleanedText.trim())}`);
        }
      };

      speechInstance.onend = () => {
        setIsListening(false);
      };

      speechInstance.onerror = (event: any) => {
        console.error('Lỗi nhận diện giọng nói:', event.error);
        if (event.error === 'not-allowed') {
          message.error('Vui lòng cấp quyền Microphone trên trình duyệt để tìm kiếm!');
        } else {
          message.error('Hệ thống chưa nghe rõ, vui lòng thử lại.');
        }
        setIsListening(false);
      };

      setRecognition(speechInstance);
    }
  }, [navigate]);

  const handleToggleVoiceSearch = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!recognition) {
      message.error('Trình duyệt của bạn hiện chưa hỗ trợ tính năng Speech Recognition.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

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

  const handleGoToWishlist = () => {
    navigate('/wishlist');
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
      label: 'Danh sách yêu thích',
      key: 'wishlist',
      icon: <HeartOutlined />,
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

    if (key === 'wishlist') {
      handleGoToWishlist();
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
              onOpenChange={(flag) => {
                if (isListening) return;
                setIsSearchFocused(flag);
              }}
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
                    <div
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}
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
                    <div
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}
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
                  // ĐƯA ICON MICRO VÀO PHẦN SUFFIX CỦA INPUT ANTD
                  suffix={
                    <Tooltip title={isListening ? 'Đang nghe...' : 'Tìm kiếm bằng giọng nói'}>
                      {isListening ? (
                        <AudioMutedOutlined
                          onClick={handleToggleVoiceSearch}
                          style={{ color: '#ff4d4f', fontSize: '16px', cursor: 'pointer' }}
                          className="voice-icon-pulsing"
                        />
                      ) : (
                        <AudioOutlined
                          onClick={handleToggleVoiceSearch}
                          style={{
                            color: '#8c8c8c',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#1677ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#8c8c8c')}
                        />
                      )}
                    </Tooltip>
                  }
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
              <div
                className="action-item-wishlist"
                onClick={handleGoToWishlist}
                style={{
                  cursor: 'pointer',
                  marginRight: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Badge
                  count={isAuthenticated ? (wishlistBookIds?.length ?? 0) : 0}
                  size="small"
                  showZero
                  color="#ff4d4f"
                >
                  <HeartOutlined
                    style={{ fontSize: '21px', color: '#595959', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d4f')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#595959')}
                  />
                </Badge>
              </div>

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

      {/* modal hiển thị khi đang thu âm*/}
      <Modal
        open={isListening}
        footer={null}
        closable={false}
        centered
        width={280}
        styles={{ body: { textAlign: 'center', padding: '24px' } }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
        >
          <AudioOutlined
            style={{ fontSize: '36px', color: '#ff4d4f' }}
            className="voice-icon-pulsing"
          />
          <div style={{ fontWeight: 600, fontSize: '15px', color: '#262626' }}>Mời bạn nói...</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Hệ thống đang lắng nghe tên sách</div>
        </div>
      </Modal>

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
                navigate('/wishlist');
                setOpenDrawer(false);
              }}
            >
              Danh sách yêu thích ({wishlistBookIds?.length ?? 0})
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
