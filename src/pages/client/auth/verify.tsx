import type { FormProps } from 'antd';
import { App, Button, Divider, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import './verify.scss';
import { resendCodeAPI, verifyAPI } from '@/services/api';
import {
  CheckCircleOutlined,
  HomeOutlined,
  MailOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';

type FieldType = {
  codeId: string;
};

const { Text, Title } = Typography;

const getErrorMessage = (res: any, fallbackMessage: string) => {
  const responseMessage = res?.error?.message || res?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage[0] || fallbackMessage;
  }

  return responseMessage || fallbackMessage;
};

const normalizeVerificationCode = (code: string) => {
  return code.replace(/\s/g, '').trim();
};

const VerifyPage = () => {
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const email = (location.state as { email?: string } | null)?.email;

  const [isSubmit, setIsSubmit] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(10);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!email) {
      notification.warning({
        message: 'Không tìm thấy email',
        description: 'Vui lòng quay lại trang đăng ký để nhận lại mã xác thực.',
      });
      return;
    }

    setIsResending(true);

    const res = await resendCodeAPI(email);

    if (res?.data) {
      message.success('Đã gửi lại mã xác thực. Vui lòng kiểm tra email của bạn.');
      startCountdown();
    } else {
      message.error(getErrorMessage(res, 'Gửi lại mã thất bại, vui lòng thử lại sau.'));
    }

    setIsResending(false);
  };

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    if (!id) return;

    const codeId = normalizeVerificationCode(values.codeId);

    setIsSubmit(true);

    const res = await verifyAPI(id, codeId);

    if (res?.data) {
      message.success('Kích hoạt tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } else {
      message.error(getErrorMessage(res, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'));
    }

    setIsSubmit(false);
  };

  if (!id) {
    return (
      <div className="verify-page">
        <section className="verify-page__card verify-page__card--invalid">
          <div className="verify-page__status-icon verify-page__status-icon--warning">
            <WarningOutlined />
          </div>

          <Title level={2}>Truy cập không hợp lệ</Title>

          <Text>
            Bạn cần đăng ký tài khoản trước khi kích hoạt. Vui lòng quay lại trang đăng ký để tiếp
            tục.
          </Text>

          <div className="verify-page__invalid-actions">
            <Button type="primary" size="large" onClick={() => navigate('/register')}>
              Đăng ký ngay
            </Button>

            <Button size="large" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <section className="verify-page__card">
        <div className="verify-page__status-icon">
          <SafetyCertificateOutlined />
        </div>

        <div className="verify-page__header">
          <Title level={2}>Kích hoạt tài khoản</Title>
          <Text>Nhập mã xác thực đã được gửi tới email của bạn.</Text>
        </div>

        <div className="verify-page__email-box">
          <MailOutlined />

          <div>
            <span>Mã xác thực đã được gửi tới</span>
            <b>{email || 'Email đăng ký của bạn'}</b>
          </div>
        </div>

        <Form<FieldType>
          name="form-verify"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
          className="verify-page__form"
        >
          <Form.Item<FieldType>
            label="Mã xác thực"
            name="codeId"
            rules={[{ required: true, message: 'Vui lòng nhập mã xác thực!' }]}
          >
            <Input size="large" placeholder="Dán mã xác thực từ email" maxLength={64} autoFocus />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmit}
            size="large"
            block
            icon={<CheckCircleOutlined />}
            className="verify-page__submit-btn"
          >
            Xác nhận kích hoạt
          </Button>
        </Form>

        <div className="verify-page__resend">
          <Text>Không nhận được mã?</Text>

          <Button
            type="link"
            onClick={handleResend}
            loading={isResending}
            disabled={countdown > 0}
            icon={<ReloadOutlined />}
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
          </Button>
        </div>

        <Divider />

        <div className="verify-page__links">
          <Link to="/">
            <HomeOutlined /> Về trang chủ
          </Link>

          <Link to="/login">Đăng nhập</Link>
        </div>
      </section>
    </div>
  );
};

export default VerifyPage;
