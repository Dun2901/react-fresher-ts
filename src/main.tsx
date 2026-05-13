import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Layout from "@/layout";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import BookPage from "pages/client/book";
import AboutPage from "pages/client/about";
import LoginPage from "pages/client/auth/login";
import RegisterPage from "pages/client/auth/register";
import "styles/global.scss";
import HomePage from "pages/client/home";
import { App, ConfigProvider } from "antd";
import { AppProvider } from "components/context/app.context";
import ProtectedRoute from "@/components/auth";
import DashBoardPage from "pages/admin/dashboard";
import ManageBookPage from "pages/admin/manage.book";
import ManageOrderPage from "pages/admin/manage.order";
import ManageUserPage from "pages/admin/manage.user";
import LayoutAdmin from "components/layout/layout.admin";
import enUS from "antd/locale/en_US";
import VerifyPage from "pages/client/auth/verify";
import DetailUserPage from "pages/admin/detail.user";
import { DollarCircleOutlined, ExceptionOutlined, TeamOutlined } from "@ant-design/icons";
// import viVN from 'antd/locale/vi_VN';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "/book",
        element: <BookPage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/checkout",
        element: (
          <ProtectedRoute>
            <div>checkout page</div>
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "admin",
    element: <LayoutAdmin />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <DashBoardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "book",
        element: (
          <ProtectedRoute>
            <ManageBookPage />
          </ProtectedRoute>
        ),
        handle: {
          breadcrumb: { label: "Quản lý sách", icon: <ExceptionOutlined /> },
        },
      },
      {
        path: "order",
        element: (
          <ProtectedRoute>
            <ManageOrderPage />
          </ProtectedRoute>
        ),
        handle: {
          breadcrumb: { label: "Quản lý đơn hàng", icon: <DollarCircleOutlined /> },
        },
      },
      {
        path: "user",
        handle: {
          breadcrumb: {
            label: "Quản lý người dùng",
            href: "/admin/user",
            icon: <TeamOutlined />,
          },
        },
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <ManageUserPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ":id",
            element: (
              <ProtectedRoute>
                <DetailUserPage />
              </ProtectedRoute>
            ),
            handle: {
              breadcrumb: (params: Record<string, string | undefined>) => ({
                label: params.id,
              }),
            },
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/verify/:id",
    element: <VerifyPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App>
      <AppProvider>
        <ConfigProvider locale={enUS}>
          <RouterProvider router={router} />
        </ConfigProvider>
      </AppProvider>
    </App>
  </StrictMode>,
);
