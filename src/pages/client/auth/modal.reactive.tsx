import { Modal, Form, Input, Button, Steps, message } from "antd";
import { SmileOutlined, SolutionOutlined, UserOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { resendCodeAPI, verifyAPI } from "@/services/api";

interface IProps {
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  userEmail: string;
}

const ModalReactive = (props: IProps) => {
  const { isModalOpen, setIsModalOpen, userEmail } = props;
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (userEmail) {
      form.setFieldValue("email", userEmail);
    }
  }, [userEmail, form]);

  // Reset khi đóng modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrent(0);
    setUserId("");
    form.resetFields(); // ← reset form
  };

  const handleResendEmail = async (values: { email: string }) => {
    const { email } = values;
    setIsLoading(true);
    const res = await resendCodeAPI(email);

    if (res && res.data) {
      message.success("Đã gửi mã xác thực! Kiểm tra email của bạn.");
      setUserId(res.data._id);
      setCurrent(1);
    } else {
      message.error(res.message ?? "Gửi thất bại, thử lại sau.");
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async (values: { codeId: string }) => {
    const { codeId } = values;
    setIsLoading(true);
    const res = await verifyAPI(userId, codeId);

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
        title="Kích hoạt tài khoản"
        open={isModalOpen}
        onCancel={handleCancel}
        maskClosable={false}
        footer={null}
        centered
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
        {/* Bước 0 — Form nhập email */}
        {current === 0 && (
          <Form onFinish={handleResendEmail} autoComplete="off" form={form}>
            <p style={{ marginBottom: 16, color: "#80868b" }}>
              Tài khoản của bạn chưa được kích hoạt! vui lòng ấn gửi lại mã.
            </p>
            <Form.Item name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Gửi mã xác thực
              </Button>
            </Form.Item>
          </Form>
        )}
        {/* Bước 1 — Form nhập code */}
        {current === 1 && (
          <Form onFinish={handleVerifyCode} autoComplete="off">
            <p style={{ marginBottom: 16, color: "#80868b" }}>
              Mã xác thực đã gửi tới <strong>{userEmail}</strong>
            </p>
            <Form.Item
              name="codeId"
              rules={[{ required: true, message: "Vui lòng nhập mã xác thực!" }]}
            >
              <Input placeholder="Nhập mã từ email..." size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Xác nhận
              </Button>
            </Form.Item>
          </Form>
        )}
        {/* Bước 2 — Done */}
        {current === 2 && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <SmileOutlined style={{ fontSize: "3rem", color: "#52c41a" }} />
            <h3 style={{ marginTop: 16 }}>Kích hoạt thành công!</h3>
            <p style={{ color: "#80868b", marginBottom: 10 }}>
              Tài khoản của bạn đã được kích hoạt.
            </p>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                handleCancel();
              }}
            >
              Đăng nhập ngay
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ModalReactive;
