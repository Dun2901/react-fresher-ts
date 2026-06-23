import React, { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  DollarCircleOutlined,
  DownOutlined,
  ExceptionOutlined,
  HeartTwoTone,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Avatar, Button, Dropdown, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, UIMatch, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { useCurrentApp } from '../context/app.context';
import { logoutAPI } from '@/services/api';
import { formatCurrency, getAvatarUrl } from '@/services/helper';
import AppBreadcrumb from '../share/breadcrumb';
import './layout.admin.scss';

type MenuItem = Required<MenuProps>['items'][number];

const { Content, Footer, Sider } = Layout;

const LayoutAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openUserDropdown, setOpenUserDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const pathnameParts = location.pathname.split('/');
  const selectedKey =
    location.pathname === '/admin' ? '/admin' : `/${pathnameParts.slice(1, 3).join('/')}`;

  const { user, setUser, setIsAuthenticated, isAuthenticated } = useCurrentApp();
  const { notification } = App.useApp();

  const matches = useMatches() as UIMatch<unknown, HandleType>[];
  const crumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumb))
    .map((match) => {
      const breadcrumb = match.handle.breadcrumb;
      return typeof breadcrumb === 'function' ? breadcrumb(match.params) : breadcrumb;
    });

  useEffect(() => {
    const closeDropdownOnScroll = () => {
      setOpenUserDropdown(false);
    };

    window.addEventListener('scroll', closeDropdownOnScroll, true);

    return () => {
      window.removeEventListener('scroll', closeDropdownOnScroll, true);
    };
  }, []);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    const handleNewOrder = (event: Event) => {
      const payload = (event as CustomEvent<IAdminNewOrderSocketPayload>).detail;
      const order = payload?.order;

      notification.success({
        message: 'Có đơn hàng mới',
        description: order
          ? `${order.orderCode} - ${order.customerName || 'Khách hàng'} vừa đặt ${formatCurrency(
              order.totalPrice,
            )}.`
          : 'Có đơn hàng mới vừa được đặt.',
        btn: (
          <Button type="primary" size="small" onClick={() => navigate('/admin/order')}>
            Xem đơn
          </Button>
        ),
      });
    };

    window.addEventListener('admin:order:new', handleNewOrder);

    return () => {
      window.removeEventListener('admin:order:new', handleNewOrder);
    };
  }, [navigate, notification, user?.role]);

  const handleLogout = async () => {
    const res = await logoutAPI();

    if (res.data) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
      setOpenUserDropdown(false);
      navigate('/');
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Tổng quan',
      key: '/admin',
      icon: <AppstoreOutlined />,
      title: 'Tổng quan',
    },
    {
      label: 'Quản lý người dùng',
      key: '/admin/user',
      icon: <TeamOutlined />,
      title: 'Quản lý người dùng',
    },
    {
      label: 'Quản lý sách',
      key: '/admin/book',
      icon: <ExceptionOutlined />,
      title: 'Quản lý sách',
    },
    {
      label: 'Danh mục',
      key: '/admin/category',
      icon: <TagsOutlined />,
      title: 'Danh mục',
    },
    {
      label: 'Quản lý đơn hàng',
      key: '/admin/order',
      icon: <DollarCircleOutlined />,
      title: 'Quản lý đơn hàng',
    },
  ];

  const itemsDropdown: MenuProps['items'] = [
    {
      label: 'Quản lý tài khoản',
      key: 'account',
      icon: <UserOutlined />,
    },
    {
      label: 'Trang chủ',
      key: 'home',
      icon: <HomeOutlined />,
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
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    setOpenUserDropdown(false);

    if (key === 'account') {
      navigate('/profile');
      return;
    }

    if (key === 'home') {
      navigate('/');
      return;
    }

    if (key === 'logout') {
      void handleLogout();
    }
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const urlAvatar = getAvatarUrl(user?.avatar);

  if (isAuthenticated === false) {
    return <Outlet />;
  }

  const isAdminRoute = location.pathname.includes('admin');

  if (isAuthenticated === true && isAdminRoute === true) {
    const role = user?.role;

    if (role === 'USER') {
      return <Outlet />;
    }
  }

  return (
    <Layout className={`layout-admin ${collapsed ? 'layout-admin--collapsed' : ''}`}>
      <Sider
        width={260}
        collapsedWidth={88}
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        className="layout-admin__sider"
      >
        <div className="layout-admin__brand">{collapsed ? '📚' : 'Quản trị'}</div>

        <Menu
          selectedKeys={[selectedKey]}
          mode="inline"
          inlineCollapsed={collapsed}
          items={menuItems}
          onClick={handleMenuClick}
          className="layout-admin__menu"
        />

        <button
          type="button"
          className="layout-admin__collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </Sider>

      <Layout className="layout-admin__main">
        <div className="layout-admin__header">
          <span className="layout-admin__trigger">
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              onClick: () => setCollapsed(!collapsed),
            })}
          </span>

          <Dropdown
            menu={{
              items: itemsDropdown,
              onClick: handleUserMenuClick,
            }}
            trigger={['click']}
            placement="bottomRight"
            open={openUserDropdown}
            onOpenChange={setOpenUserDropdown}
            overlayClassName="admin-user-dropdown-overlay"
            getPopupContainer={(triggerNode) =>
              (triggerNode.closest('.layout-admin__header') as HTMLElement) || document.body
            }
          >
            <button type="button" className="layout-admin__user">
              <Avatar
                className="layout-admin__user-avatar"
                src={urlAvatar}
                icon={<UserOutlined />}
              />

              <span className="layout-admin__user-meta">
                <span className="layout-admin__user-name">{user?.fullName || 'Admin'}</span>
                <span className="layout-admin__user-role">Quản trị viên</span>
              </span>

              <DownOutlined className="layout-admin__user-arrow" />
            </button>
          </Dropdown>
        </div>

        <Content className="layout-admin__content">
          {crumbs.length > 0 && <AppBreadcrumb items={crumbs} />}
          <Outlet />
        </Content>

        <Footer className="layout-admin__footer">
          BookStore &copy; {new Date().getFullYear()} — Made with <HeartTwoTone />
        </Footer>
      </Layout>
    </Layout>
  );
};

export default LayoutAdmin;
