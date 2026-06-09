import { loginAPI } from '@/services/api';
import './login.scss';
import type { FormProps } from 'antd';
import { App, Button, Divider, Form, Input, Typography } from 'antd';
import {
  BookOutlined,
  LockOutlined,
  LoginOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentApp } from '@/components/context/app.context';
import ModalReactive from './modal.reactive';
import ModalChangePassword from './modal.change.password';

type FieldType = {
  email: string;
  password: string;
};

const { Text, Title } = Typography;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.018 17.64 11.71 17.64 9.2z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

const getErrorMessage = (res: any, fallbackMessage: string) => {
  const responseMessage = res?.error?.message || res?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage[0] || fallbackMessage;
  }

  return responseMessage || fallbackMessage;
};

const LoginPage = () => {
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useCurrentApp();

  const [isSubmit, setIsSubmit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    const { email, password } = values;

    setUserEmail('');
    setIsSubmit(true);

    const res = await loginAPI(email.trim(), password);

    setIsSubmit(false);

    if (res?.data) {
      setIsAuthenticated(true);
      setUser(res.data.user);
      localStorage.setItem('access_token', res.data.access_token);

      message.success('Đăng nhập thành công!');
      navigate('/');
      return;
    }

    const errorMessage = getErrorMessage(res, 'Đăng nhập thất bại, vui lòng thử lại.');

    if (errorMessage === 'Tài khoản chưa được kích hoạt!') {
      setUserEmail(email);
      setIsModalOpen(true);
      return;
    }

    notification.error({
      message: 'Đăng nhập thất bại',
      description: errorMessage,
      duration: 5,
    });
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/google`;
  };

  return (
    <>
      <div className="login-page">
        <div className="login-page__shell">
          <section className="login-page__intro">
            <div className="login-page__brand">
              <BookOutlined />
              <span>BookStore</span>
            </div>

            <Title level={1} className="login-page__intro-title">
              Chào mừng bạn quay lại
            </Title>

            <Text className="login-page__intro-desc">
              Đăng nhập để tiếp tục mua sách, theo dõi đơn hàng và quản lý thông tin tài khoản của
              bạn.
            </Text>

            <div className="login-page__benefits">
              <div className="login-page__benefit">
                <SafetyCertificateOutlined />
                <span>Tài khoản được bảo mật</span>
              </div>

              <div className="login-page__benefit">
                <LoginOutlined />
                <span>Theo dõi đơn hàng nhanh hơn</span>
              </div>

              <div className="login-page__benefit">
                <UserAddOutlined />
                <span>Dễ dàng mua sách lần sau</span>
              </div>
            </div>
          </section>

          <section className="login-page__card">
            <div className="login-page__card-header">
              <Title level={2}>Đăng nhập</Title>
              <Text>Nhập email và mật khẩu để tiếp tục.</Text>
            </div>

            <Form<FieldType>
              name="form-login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              requiredMark={false}
              className="login-page__form"
            >
              <Form.Item<FieldType>
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không đúng định dạng!' },
                ]}
              >
                <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
              </Form.Item>

              <Form.Item<FieldType>
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                />
              </Form.Item>

              <div className="login-page__forgot-row">
                <Button type="link" onClick={() => setIsChangePasswordOpen(true)}>
                  Quên mật khẩu?
                </Button>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmit}
                size="large"
                block
                className="login-page__submit-btn"
              >
                Đăng nhập
              </Button>

              <Divider plain>Hoặc</Divider>

              <Button
                icon={<GoogleIcon />}
                block
                size="large"
                onClick={handleGoogleLogin}
                className="login-page__google-btn"
              >
                Đăng nhập với Google
              </Button>

              <p className="login-page__footer-text">
                Chưa có tài khoản?
                <Link to="/register"> Đăng ký ngay</Link>
              </p>
            </Form>
          </section>
        </div>
      </div>

      <ModalReactive
        userEmail={userEmail}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      <ModalChangePassword
        isChangePasswordOpen={isChangePasswordOpen}
        setIsChangePasswordOpen={setIsChangePasswordOpen}
      />
    </>
  );
};

export default LoginPage;
