import type { FormProps } from "antd";
import { Button, Divider, Form, Input, App } from "antd";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./verify.scss";
import { resendCodeAPI, verifyAPI } from "@/services/api";
import { MailOutlined, WarningOutlined } from "@ant-design/icons";

type FieldType = {
  codeId: string;
};

const VerifyPage = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [isSubmit, setIsSubmit] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // if (!state?._id) {
  //   navigate("/register");
  //   return null;
  // }

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
    setIsResending(true);
    const res = await resendCodeAPI(state.email);

    if (res && res.data) {
      message.success("Đã gửi lại mã xác thực! Kiểm tra email của bạn.");
      startCountdown();
    } else {
      message.error(res.message ?? "Gửi lại mã thất bại, thử lại sau.");
    }
    setIsResending(false);
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setIsSubmit(true);
    const { codeId } = values;
    const res = await verifyAPI(state?._id, codeId);

    if (res && res.data) {
      // Success
      message.success("Kích hoạt tài khoản thành công!");
      navigate("/login");
    } else {
      // Error
      message.error(res.message ?? "Mã xác thực không hợp lệ.");
    }
    setIsSubmit(false);
  };

  return (
    <>
      {!state?._id ? (
        // ← Không có _id → hiện trang cảnh báo
        <div className="verify-page">
          <main className="main">
            <div className="container">
              <section className="wrapper" style={{ textAlign: "center" }}>
                <WarningOutlined style={{ fontSize: "3rem", color: "#faad14" }} />
                <h2 className="text text-large" style={{ marginTop: "1rem" }}>
                  Truy cập không hợp lệ
                </h2>
                <p
                  className="text text-normal"
                  style={{ color: "#80868b", margin: "0.75rem 0 1.5rem" }}
                >
                  Bạn cần đăng ký tài khoản trước khi kích hoạt.
                </p>
                <Button type="primary" size="large" onClick={() => navigate("/register")}>
                  Đăng ký ngay
                </Button>
                <div style={{ marginTop: "1rem" }}>
                  Đã có tài khoản? <Link to="/login"> Đăng nhập</Link>
                </div>
              </section>
            </div>
          </main>
        </div>
      ) : (
        <div className="verify-page">
          <main className="main">
            <div className="container">
              <section className="wrapper">
                {/* Header */}
                <div className="heading">
                  <h2 className="text text-large">Kích Hoạt Tài Khoản</h2>
                  <Divider />
                </div>

                {/* Email info */}
                <div className="email-info">
                  <MailOutlined className="email-icon" />
                  <div>
                    <p className="email-label">Mã xác thực đã được gửi tới</p>
                    <p className="email-value">{state?.email}</p>
                  </div>
                </div>

                {/* Form */}
                <Form name="form-verify" onFinish={onFinish} autoComplete="off">
                  <Form.Item<FieldType>
                    labelCol={{ span: 24 }}
                    label="Mã xác thực"
                    name="codeId"
                    rules={[{ required: true, message: "Vui lòng nhập mã xác thực!" }]}
                  >
                    <Input placeholder="Nhập mã từ email..." />
                  </Form.Item>

                  <Form.Item label={null}>
                    <Button type="primary" htmlType="submit" loading={isSubmit}>
                      Xác nhận
                    </Button>
                  </Form.Item>
                </Form>

                {/* Resend code */}
                <div className="resend-wrapper">
                  <span className="text text-normal">Không nhận được mã?</span>
                  <Button
                    type="link"
                    onClick={handleResend}
                    loading={isResending}
                    disabled={countdown > 0}
                    style={{ paddingLeft: 4 }}
                    iconPosition="end"
                  >
                    {countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã"}
                  </Button>
                </div>
                <Divider />
                {/* Footer links */}
                <p className="text text-normal" style={{ textAlign: "center" }}>
                  <Link to="/">← Quay lại trang chủ</Link>
                </p>
                <p className="text text-normal" style={{ textAlign: "center" }}>
                  Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
              </section>
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default VerifyPage;
