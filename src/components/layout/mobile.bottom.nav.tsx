import {
  AppstoreOutlined,
  FileTextOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';
import './mobile.bottom.nav.scss';

interface IMobileNavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  requireAuth?: boolean;
  activeWhen: (pathname: string) => boolean;
  badge?: number;
}

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, carts } = useCurrentApp();

  const pathname = location.pathname;

  const totalCartQuantity = carts.reduce((total, item) => total + item.quantity, 0);

  const shouldHideBottomNav =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify' ||
    pathname === '/checkout' ||
    pathname === '/cart' ||
    pathname.startsWith('/book/') ||
    pathname.startsWith('/payment/');

  if (shouldHideBottomNav) {
    return null;
  }

  const navItems: IMobileNavItem[] = [
    {
      key: 'home',
      label: 'Trang chủ',
      path: '/',
      icon: <HomeOutlined />,
      activeWhen: (currentPath) => currentPath === '/',
    },
    {
      key: 'book',
      label: 'Sách',
      path: '/book',
      icon: <AppstoreOutlined />,
      activeWhen: (currentPath) => currentPath === '/book',
    },
    {
      key: 'orders',
      label: 'Đơn hàng',
      path: '/orders',
      icon: <FileTextOutlined />,
      requireAuth: true,
      activeWhen: (currentPath) => currentPath.startsWith('/orders'),
    },
    {
      key: 'cart',
      label: 'Giỏ hàng',
      path: '/cart',
      icon: <ShoppingCartOutlined />,
      requireAuth: true,
      badge: totalCartQuantity,
      activeWhen: (currentPath) => currentPath === '/cart' || currentPath === '/checkout',
    },
    {
      key: 'account',
      label: isAuthenticated ? 'Tài khoản' : 'Đăng nhập',
      path: isAuthenticated ? '/profile' : '/login',
      icon: <UserOutlined />,
      activeWhen: (currentPath) =>
        currentPath === '/profile' ||
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/verify',
    },
  ];

  const handleNavigate = (item: IMobileNavItem) => {
    if (item.requireAuth && !isAuthenticated) {
      navigate('/login', {
        state: {
          from: pathname + location.search,
        },
      });
      return;
    }

    navigate(item.path);
  };

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = item.activeWhen(pathname);

        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-bottom-nav__item ${
              isActive ? 'mobile-bottom-nav__item--active' : ''
            }`}
            onClick={() => handleNavigate(item)}
          >
            <span className="mobile-bottom-nav__icon">
              {item.badge !== undefined ? (
                <Badge
                  count={item.badge}
                  size="small"
                  showZero={false}
                  offset={[1, -2]}
                  className="mobile-bottom-nav__badge"
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </span>

            <span className="mobile-bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
