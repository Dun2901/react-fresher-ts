import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from '@/layout';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AboutPage from 'pages/client/about';
import LoginPage from 'pages/client/auth/login';
import RegisterPage from 'pages/client/auth/register';
import CartPage from 'pages/client/cart/cartPage.tsx';
import 'styles/global.scss';
import HomePage from 'pages/client/homepage/home.tsx';
import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { AppProvider } from 'components/context/app.context';
import ProtectedRoute from '@/components/auth';
import DashBoardPage from 'pages/admin/dashboard';
import ManageBookPage from 'pages/admin/manage.book';
import ManageOrderPage from 'pages/admin/manage.order';
import ManageUserPage from 'pages/admin/manage.user';
import LayoutAdmin from 'components/layout/layout.admin';
import VerifyPage from 'pages/client/auth/verify';
import DetailUserPage from 'pages/admin/detail.user';
import {
  DollarCircleOutlined,
  ExceptionOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import DetailBookPage from './pages/admin/detail.book';
import VnpayReturnPage from './pages/client/payments/vnpay.return';
import CheckoutPage from './pages/client/checkout/checkout.page';
import OrderDetailPage from './pages/client/order/detail/order.detail';
import CurrentOrdersPage from './pages/client/order/current/current.order';
import OrderHistoryPage from './pages/client/order/history/order.history';
import ManageCategoryPage from './pages/admin/manage.category';
import BookListPage from 'pages/client/book/bookListPage';
import BookDetailPage from 'pages/client/book/bookDetailPage';
import ProfilePage from './pages/client/profile/profile.page';

dayjs.locale('vi');

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/book',
        element: <BookListPage />,
      },
      {
        path: '/book/:id',
        element: <BookDetailPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cart',
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/checkout',
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <CurrentOrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/history',
        element: (
          <ProtectedRoute>
            <OrderHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payment/vnpay-return',
        element: <VnpayReturnPage />,
      },
    ],
  },
  {
    path: 'admin',
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
        path: 'book',
        handle: {
          breadcrumb: {
            label: 'Quản lý sách',
            href: '/admin/book',
            icon: <ExceptionOutlined />,
          },
        },
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute>
                <ManageBookPage />
              </ProtectedRoute>
            ),
          },
          {
            path: ':id',
            element: (
              <ProtectedRoute>
                <DetailBookPage />
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
      {
        path: 'category',
        element: (
          <ProtectedRoute>
            <ManageCategoryPage />
          </ProtectedRoute>
        ),
        handle: {
          breadcrumb: {
            label: 'Quản lý danh mục',
            href: '/admin/category',
            icon: <TagsOutlined />,
          },
        },
      },
      {
        path: 'order',
        element: (
          <ProtectedRoute>
            <ManageOrderPage />
          </ProtectedRoute>
        ),
        handle: {
          breadcrumb: {
            label: 'Quản lý đơn hàng',
            icon: <DollarCircleOutlined />,
          },
        },
      },
      {
        path: 'user',
        handle: {
          breadcrumb: {
            label: 'Quản lý người dùng',
            href: '/admin/user',
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
            path: ':id',
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
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/verify/:id',
    element: <VerifyPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={viVN}>
      <App>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </App>
    </ConfigProvider>
  </StrictMode>,
);
