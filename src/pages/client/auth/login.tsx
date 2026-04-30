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
                <Divider>Or</Divider>
                <p className="text text-normal" style={{ textAlign: "center" }}>
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
