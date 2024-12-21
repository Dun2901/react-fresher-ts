import { loginAPI } from '@/services/api';
import './login.scss';
import type { FormProps } from 'antd';
import { Button, Divider, Form, Input, App } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type FieldType = {
    username: string;
    password: string;
};

const LoginPage = () => {
    const { message, notification } = App.useApp();
    const navigate = useNavigate();
    const [isSubmit, setIsSubmit] = useState(false);

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        const { username, password } = values;
        setIsSubmit(true);
        const res = await loginAPI(username, password);
        setIsSubmit(false);

        if (res?.data) {
            localStorage.setItem('access_token', res.data.access_token);
            message.success('Đăng nhập tài khoản thành công!');
            navigate('/');
        } else {
            notification.error({
                message: 'Có lỗi xảy ra',
                description: res.message && Array.isArray(res.message) ? res.message[0] : res.message,
                duration: 5
            })
        };
    };

    return (
        <div className='login-page'>
            <main className='main'>
                <div className='container'>
                    <section className='wrapper'>
                        <div className='heading'>
                            <h2 className='text text-large'>Đăng Ký Tài Khoản</h2>
                            <Divider />
                        </div>
                        <Form
                            name="form-register"
                            onFinish={onFinish}
                            autoComplete="off"
                        >
                            <Form.Item<FieldType>
                                labelCol={{ span: 24 }} //whole column
                                label="Email"
                                name="username"
                                rules={[
                                    { required: true, message: 'Email không được để trống!' },
                                    { type: "email", message: "Email không đúng định dạng!" }
                                ]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item<FieldType>
                                labelCol={{ span: 24 }} //whole column
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Mật khẩu không được để trống!' }]}
                            >
                                <Input.Password />
                            </Form.Item>

                            <Form.Item label={null}>
                                <Button type="primary" htmlType="submit" loading={isSubmit}>
                                    Đăng nhập
                                </Button>
                            </Form.Item>
                            <Divider>Or</Divider>
                            <p className="text text-normal" style={{ textAlign: "center" }}>
                                Chưa có tài khoản ?
                                <span>
                                    <Link to='/register' > Đăng ký </Link>
                                </span>
                            </p>
                        </Form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;