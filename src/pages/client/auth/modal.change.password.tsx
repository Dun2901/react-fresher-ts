import { Modal, Form, Input, Button, Steps, message, Space } from "antd";
import { MailOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import { forgotPasswordAPI, resetPasswordAPI } from "@/services/api";

interface IProps {
  isChangePasswordOpen: boolean;
  setIsChangePasswordOpen: (v: boolean) => void;
}

const ModalChangePassword = (props: IProps) => {
  const { isChangePasswordOpen, setIsChangePasswordOpen } = props;
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Reset khi đóng modal
  const handleCancel = () => {
    setIsChangePasswordOpen(false);
    setCurrent(0);
    setUserEmail("");
    form.resetFields(); // ← reset form
  };

  // Bước 0: Gửi email để nhận code
  const handleSubmitEmail = async (values: { email: string }) => {
    const { email } = values;
    setIsLoading(true);
    const res = await forgotPasswordAPI(email);

    if (res && res.data) {
      message.success("Mã xác thực đã được gửi tới email của bạn!");
      setUserEmail(email);
      setCurrent(1);
    } else {
      message.error(res.message ?? "Gửi thất bại, thử lại sau.");
    }
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    const DELAY = 10 * 1000;
    setIsResending(true);
    const res = await forgotPasswordAPI(userEmail);
    if (res && res.data) {
      message.success("Đã gửi lại mã xác thực!");
    } else {
      message.error(res.message);
    }
    setTimeout(() => {
      setIsResending(false);
    }, DELAY);
  };

  const handleConfirm = async (values: {
    codeId: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const { codeId, newPassword, confirmPassword } = values;

    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    setIsLoading(true);
    const res = await resetPasswordAPI(userEmail, codeId, newPassword, confirmPassword);

    if (res && res.data) {
      setCurrent(2);
    } else {
      message.error(res.message ?? "Mã xác thực không hợp lệ.");
    }
    setIsLoading(false);
  };

  return (
    <>
      <Modal
        title="Quên mật khẩu"
        open={isChangePasswordOpen}
        onCancel={handleCancel}
        maskClosable={false}
        centered
        footer={null}
        forceRender
      >
        <Steps
          current={current}
          style={{ marginBottom: 24 }}
          items={[
            {
              title: "Nhập email",
              icon: <UserOutlined />,
            },
            {
              title: "Xác thực",
              icon: <SolutionOutlined />,
            },
            {
              title: "Hoàn tất",
              icon: <SmileOutlined />,
            },
          ]}
        />
        {/* Bước 0 — Nhập email */}
        {current === 0 && (
          <Form onFinish={handleSubmitEmail} autoComplete="off" form={form}>
            <p style={{ marginBottom: 16, color: "#80868b" }}>
              Để thực hiện thay đổi mật khẩu, vui lòng nhập email tài khoản của bạn.
            </p>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không đúng định dạng!" },
              ]}
            >
              <Input size="large" placeholder="Email" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Xác nhận
              </Button>
            </Form.Item>
          </Form>
        )}
        {/* Bước 1 — Nhập code + mật khẩu mới */}
        {current === 1 && (
          <Form onFinish={handleConfirm} autoComplete="off" layout="vertical">
            <Form.Item label="Mã xác thực" required style={{ marginBottom: 8 }}>
              <Space.Compact style={{ width: "100%" }}>
                <Form.Item
                  name="codeId"
                  noStyle
                  rules={[{ required: true, message: "Vui lòng nhập mã xác thực!" }]}
                >
                  <Input size="large" placeholder="Nhập mã từ email..." />
                </Form.Item>
                <Button
                  type="primary"
                  size="large"
                  icon={<MailOutlined />}
                  loading={isResending}
                  onClick={handleResendCode}
                />
              </Space.Compact>
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
            >
              <Input.Password size="large" placeholder="Mật khẩu mới" />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu!" }]}
            >
              <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
            </Form.Item>

            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Xác nhận thay đổi
              </Button>
            </Form.Item>
          </Form>
        )}
        {/* Bước 2 — Done */}
        {current === 2 && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <SmileOutlined style={{ fontSize: "3rem", color: "#52c41a" }} />
            <h3 style={{ marginTop: 16 }}>Đổi mật khẩu thành công!</h3>
            <p style={{ color: "#80868b", marginBottom: 16 }}>Mật khẩu của bạn đã được cập nhật.</p>
            <Button type="primary" size="large" onClick={handleCancel}>
              Đăng nhập ngay
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ModalChangePassword;
