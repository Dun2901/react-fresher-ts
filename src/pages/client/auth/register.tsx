import type { FormProps } from 'antd';
import { App, Button, Divider, Form, Input, Typography } from 'antd';
import {
  BookOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './register.scss';
import { registerAPI } from '@/services/api';

type FieldType = {
  fullName: string;
  email: string;
  password: string;
  phone: string;
};

const { Text, Title } = Typography;

const getErrorMessage = (res: any, fallbackMessage: string) => {
  const responseMessage = res?.error?.message || res?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage[0] || fallbackMessage;
  }

  return responseMessage || fallbackMessage;
};

const RegisterPage = () => {
  const { notification } = App.useApp();
  const navigate = useNavigate();
  const [isSubmit, setIsSubmit] = useState(false);

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setIsSubmit(true);

    const { fullName, email, password, phone } = values;
    const res = await registerAPI(fullName.trim(), email.trim(), password, phone.trim());

    if (res?.data) {
      notification.success({
        message: 'Đăng ký thành công!',
        description: 'Vui lòng kiểm tra email để lấy mã xác thực tài khoản.',
      });

      navigate(`/verify/${res.data._id}`, {
        state: { email: values.email },
      });
    } else {
      notification.error({
        message: 'Đăng ký thất bại',
        description: getErrorMessage(res, 'Không thể đăng ký tài khoản, vui lòng thử lại.'),
        duration: 5,
      });
    }

    setIsSubmit(false);
  };

  return (
    <div className="register-page">
      <div className="register-page__shell">
        <section className="register-page__card">
          <div className="register-page__card-header">
            <Title level={2}>Đăng ký tài khoản</Title>
            <Text>Tạo tài khoản để mua sách và theo dõi đơn hàng dễ dàng hơn.</Text>
          </div>

          <Form<FieldType>
            name="form-register"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            requiredMark={false}
            className="register-page__form"
          >
            <Form.Item<FieldType>
              label="Họ tên"
              name="fullName"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input size="large" prefix={<UserOutlined />} placeholder="Nhập họ tên" />
            </Form.Item>

            <Form.Item<FieldType>
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' },
              ]}
            >
              <Input size="large" prefix={<MailOutlined />} placeholder="Nhập email" />
            </Form.Item>

            <Form.Item<FieldType>
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu cần tối thiểu 6 ký tự!' },
              ]}
            >
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item<FieldType>
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                {
                  pattern: /^(0|\+84)[0-9]{9,10}$/,
                  message: 'Số điện thoại không hợp lệ!',
                },
              ]}
            >
              <Input size="large" prefix={<PhoneOutlined />} placeholder="Ví dụ: 0901234567" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmit}
              size="large"
              block
              className="register-page__submit-btn"
            >
              Đăng ký
            </Button>

            <Divider plain>Hoặc</Divider>

            <p className="register-page__footer-text">
              Đã có tài khoản?
              <Link to="/login"> Đăng nhập</Link>
            </p>
          </Form>
        </section>

        <section className="register-page__intro">
          <div className="register-page__brand">
            <BookOutlined />
            <span>BookStore</span>
          </div>

          <Title level={1} className="register-page__intro-title">
            Bắt đầu hành trình đọc sách của bạn
          </Title>

          <Text className="register-page__intro-desc">
            Tạo tài khoản để lưu thông tin mua hàng, quản lý đơn hàng và nhận trải nghiệm tốt hơn
            khi mua sách tại BookStore.
          </Text>

          <div className="register-page__benefits">
            <div className="register-page__benefit">
              <SafetyCertificateOutlined />
              <span>Xác thực tài khoản qua email</span>
            </div>

            <div className="register-page__benefit">
              <BookOutlined />
              <span>Lưu lịch sử mua sách</span>
            </div>

            <div className="register-page__benefit">
              <UserOutlined />
              <span>Quản lý hồ sơ cá nhân</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
