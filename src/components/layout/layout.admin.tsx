import React, { useState } from "react";
import {
  AppstoreOutlined,
  ExceptionOutlined,
  HeartTwoTone,
  TeamOutlined,
  UserOutlined,
  DollarCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Dropdown, Space, Avatar } from "antd";
import { Outlet, UIMatch, useLocation, useMatches } from "react-router-dom";
import { Link } from "react-router-dom";
import { useCurrentApp } from "../context/app.context";
import type { MenuProps } from "antd";
import { logoutAPI } from "@/services/api";
import { getAvatarUrl } from "@/services/helper";
import AppBreadcrumb from "../share/breadcrumb";
type MenuItem = Required<MenuProps>["items"][number];

const { Content, Footer, Sider } = Layout;

const LayoutAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const selectedKey = "/" + location.pathname.split("/").slice(1, 3).join("/");
  const openKey = selectedKey.split("/")[2];

  const { user, setUser, setIsAuthenticated, isAuthenticated } = useCurrentApp();

  const matches = useMatches() as UIMatch<unknown, HandleType>[];
  const crumbs = matches
    .filter((match) => Boolean(match.handle?.breadcrumb))
    .map((match) => {
      const breadcrumb = match.handle.breadcrumb;
      return typeof breadcrumb === "function" ? breadcrumb(match.params) : breadcrumb;
    });

  const handleLogout = async () => {
    //todo
    const res = await logoutAPI();
    if (res.data) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("access_token");
    }
  };

  const items: MenuItem[] = [
    {
      label: <Link to="/admin">Dashboard</Link>,
      key: "/admin",
      icon: <AppstoreOutlined />,
    },
    {
      label: <span>Manage Users</span>,
      key: "user",
      icon: <UserOutlined />,
      children: [
        {
          label: <Link to="/admin/user">CRUD</Link>,
          key: "/admin/user",
          icon: <TeamOutlined />,
        },
        // {
        //     label: 'Files1',
        //     key: 'file1',
        //     icon: <TeamOutlined />,
        // }
      ],
    },
    {
      label: <span>Manage Books</span>,
      key: "book",
      icon: <ExceptionOutlined />,
      children: [
        {
          label: <Link to="/admin/book">CRUD</Link>,
          key: "/admin/book",
          icon: <ExceptionOutlined />,
        },
      ],
    },
    {
      label: <Link to="/admin/order">Manage Orders</Link>,
      key: "/admin/order",
      icon: <DollarCircleOutlined />,
    },
  ];

  const itemsDropdown = [
    {
      label: (
        <label style={{ cursor: "pointer" }} onClick={() => alert("me")}>
          Quản lý tài khoản
        </label>
      ),
      key: "account",
    },
    {
      label: <Link to={"/"}>Trang chủ</Link>,
      key: "home",
    },
    {
      label: (
        <label style={{ cursor: "pointer" }} onClick={() => handleLogout()}>
          Đăng xuất
        </label>
      ),
      key: "logout",
    },
  ];

  const urlAvatar = getAvatarUrl(user?.avatar);

  if (isAuthenticated === false) {
    return <Outlet />;
  }

  const isAdminRoute = location.pathname.includes("admin");
  if (isAuthenticated === true && isAdminRoute === true) {
    const role = user?.role;
    if (role === "USER") {
      return <Outlet />;
    }
  }

  return (
    <>
      <Layout style={{ minHeight: "100vh" }} className="layout-admin">
        <Sider
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <div style={{ height: 32, margin: 16, textAlign: "center" }}>Admin</div>
          <Menu
            selectedKeys={[selectedKey]}
            defaultOpenKeys={openKey ? [openKey] : []}
            mode="inline"
            items={items}
          />
        </Sider>
        <Layout>
          <div
            className="admin-header"
            style={{
              height: "50px",
              borderBottom: "1px solid #ebebeb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 15px",
            }}
          >
            <span>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: "trigger",
                onClick: () => setCollapsed(!collapsed),
              })}
            </span>
            <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
              <Space style={{ cursor: "pointer" }}>
                <Avatar src={urlAvatar} />
                {user?.fullName}
              </Space>
            </Dropdown>
          </div>
          <Content style={{ padding: "15px" }}>
            {crumbs.length > 0 && <AppBreadcrumb items={crumbs} />}
            <Outlet />
          </Content>
          <Footer style={{ padding: 0, textAlign: "center" }}>
            React Test Fresher &copy; Hỏi Dân IT - Made with <HeartTwoTone />
          </Footer>
        </Layout>
      </Layout>
    </>
  );
};

export default LayoutAdmin;
