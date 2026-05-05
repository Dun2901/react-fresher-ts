import { loginAPI } from "@/services/api";
import "./login.scss";
import type { FormProps } from "antd";
import { Button, Divider, Form, Input, App } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrentApp } from "@/components/context/app.context";
import ModalReactive from "./modal.reactive";
import ModalChangePassword from "./modal.change.password";

type FieldType = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { message, notification } = App.useApp();
  const navigate = useNavigate();
  const [isSubmit, setIsSubmit] = useState(false);
  const { setIsAuthenticated, setUser } = useCurrentApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const { email, password } = values;
    setUserEmail("");
    setIsSubmit(true);
    const res = await loginAPI(email, password);
    setIsSubmit(false);

    if (res?.data) {
      setIsAuthenticated(true);
      setUser(res.data.user);
      localStorage.setItem("access_token", res.data.access_token);
      message.success("Đăng nhập tài khoản thành công!");
      navigate("/");
    } else {
      if (res.message === "Tài khoản chưa được kích hoạt!") {
        setUserEmail(email);
        setIsModalOpen(true);
        return;
      }

      notification.error({
        message: "Có lỗi xảy ra",
        description: res.message && Array.isArray(res.message) ? res.message[0] : res.message,
        duration: 5,
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/google`;
  };

  return (
    <>
      <div className="login-page">
        <main className="main">
          <div className="container">
            <section className="wrapper">
              <div className="heading">
                <h2 className="text text-large">Đăng Nhập</h2>
                <Divider />
              </div>
              <Form name="form-register" onFinish={onFinish} autoComplete="off">
                <Form.Item<FieldType>
                  labelCol={{ span: 24 }} //whole column
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Email không được để trống!" },
                    { type: "email", message: "Email không đúng định dạng!" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item<FieldType>
                  labelCol={{ span: 24 }} //whole column
                  label="Mật khẩu"
                  name="password"
                  rules={[{ required: true, message: "Mật khẩu không được để trống!" }]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item label={null}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Button type="primary" htmlType="submit" loading={isSubmit}>
                      Đăng nhập
                    </Button>
                    <Button type="link" onClick={() => setIsChangePasswordOpen(true)}>
                      Quên mật khẩu?
                    </Button>
                  </div>
                </Form.Item>
                <Divider>Hoặc</Divider>
                {/* login with google */}
                <Button
                  icon={
                    <svg width="16" height="16" viewBox="0 0 18 18" style={{ display: "block" }}>
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
                  }
                  block
                  size="middle"
                  onClick={handleGoogleLogin}
                >
                  Đăng nhập với Google
                </Button>
                <p className="text text-normal" style={{ textAlign: "center", marginTop: 20 }}>
                  Chưa có tài khoản ?
                  <span>
                    <Link to="/register"> Đăng ký </Link>
                  </span>
                </p>
              </Form>
            </section>
          </div>
        </main>
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
