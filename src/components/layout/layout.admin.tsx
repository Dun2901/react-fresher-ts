import React, { useState } from 'react';
import {
  AppstoreOutlined,
  ExceptionOutlined,
  HeartTwoTone,
  TeamOutlined,
  DollarCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, UIMatch, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { useCurrentApp } from '../context/app.context';
import { logoutAPI } from '@/services/api';
import { getAvatarUrl } from '@/services/helper';
import AppBreadcrumb from '../share/breadcrumb';
import './layout.admin.scss';

type MenuItem = Required<MenuProps>['items'][number];

const { Content, Footer, Sider } = Layout;

const LayoutAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const pathnameParts = location.pathname.split('/');
  const selectedKey =
    location.pathname === '/admin' ? '/admin' : `/${pathnameParts.slice(1, 3).join('/')}`;

  const { user, setUser, setIsAuthenticated, isAuthenticated } = useCurrentApp();

  const matches = useMatches() as UIMatch<unknown, HandleType>[];
  const crumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumb))
    .map((match) => {
      const breadcrumb = match.handle.breadcrumb;
      return typeof breadcrumb === 'function' ? breadcrumb(match.params) : breadcrumb;
    });

  const handleLogout = async () => {
    const res = await logoutAPI();

    if (res.data) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('access_token');
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
      label: <Link to="/profile">Quản lý tài khoản</Link>,
      key: 'account',
    },
    {
      label: <Link to="/">Trang chủ</Link>,
      key: 'home',
    },
    {
      label: (
        <label className="layout-admin__logout" onClick={handleLogout}>
          Đăng xuất
        </label>
      ),
      key: 'logout',
    },
  ];

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

          <Dropdown menu={{ items: itemsDropdown }} trigger={['click']}>
            <Space className="layout-admin__user">
              <Avatar src={urlAvatar} />
              <span>{user?.fullName}</span>
            </Space>
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
