import { useEffect, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Upload,
  UploadFile,
  UploadProps,
} from 'antd';
import {
  CameraOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import {
  changePasswordAPI,
  getProfileAPI,
  updateProfileAPI,
  uploadAvatarAPI,
} from '@/services/api';
import { getAvatarUrl } from '@/services/helper';
import { useCurrentApp } from '@/components/context/app.context';
import './profile.page.scss';

type ProfileFormType = {
  fullName: string;
  phone: string;
};

type ChangePasswordFormType = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ProfilePage = () => {
  const { user, setUser } = useCurrentApp();
  const [profile, setProfile] = useState<IUser | null>(user);
  const [avatar, setAvatar] = useState<string>(user?.avatar ?? '');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileForm] = Form.useForm<ProfileFormType>();
  const [passwordForm] = Form.useForm<ChangePasswordFormType>();

  const { message, notification } = App.useApp();

  const accountType = profile?.accountType ?? 'LOCAL';
  const isGoogleAccount = accountType === 'GOOGLE';

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await getProfileAPI();

      if (res.data) {
        setProfile(res.data);
        setAvatar(res.data.avatar ?? '');

        profileForm.setFieldsValue({
          fullName: res.data.fullName,
          phone: res.data.phone,
        });

        if (res.data.avatar) {
          const avatarUrl = getAvatarUrl(res.data.avatar);
          setFileList([
            {
              uid: '-1',
              name: res.data.avatar,
              status: 'done',
              url: avatarUrl,
              thumbUrl: avatarUrl,
            },
          ]);
        }
      }
    };

    fetchProfile();
  }, [profileForm]);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ chấp nhận file ảnh!');
      return Upload.LIST_IGNORE;
    }

    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error('Ảnh phải nhỏ hơn 1MB!');
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const handleUploadAvatar: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadAvatarAPI(formData);
      const fileName = res.data?.fileUploaded;

      if (fileName) {
        setAvatar(fileName);
        setFileList([
          {
            uid: (file as RcFile).uid,
            name: fileName,
            status: 'done',
            url: getAvatarUrl(fileName),
            thumbUrl: getAvatarUrl(fileName),
          },
        ]);

        message.success('Tải ảnh thành công.');
        onSuccess?.('ok');
      } else {
        notification.error({
          message: 'Tải ảnh thất bại',
          description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
        });
      }
    } catch (error) {
      message.error('Tải ảnh thất bại!');
      onError?.(error as Error);
    }
  };

  const handleUpdateProfile = async (values: ProfileFormType) => {
    setIsUpdatingProfile(true);

    const res = await updateProfileAPI(values.fullName, values.phone, avatar);

    if (res.data) {
      setProfile(res.data);
      setUser(res.data);
      message.success('Cập nhật thông tin tài khoản thành công.');
    } else {
      notification.error({
        message: 'Cập nhật thất bại',
        description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
      });
    }

    setIsUpdatingProfile(false);
  };

  const handleChangePassword = async (values: ChangePasswordFormType) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsChangingPassword(true);

    const res = await changePasswordAPI(values.oldPassword, values.newPassword);

    if (res.data) {
      message.success('Đổi mật khẩu thành công.');
      passwordForm.resetFields();
    } else {
      notification.error({
        message: 'Đổi mật khẩu thất bại',
        description: Array.isArray(res.error.message) ? res.error.message[0] : res.error.message,
      });
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <div className="profile-page__header">
          <div>
            <h1>Hồ sơ tài khoản</h1>
            <p>Quản lý thông tin cá nhân, avatar và mật khẩu đăng nhập của bạn.</p>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card className="profile-card profile-card--summary">
              <Space direction="vertical" align="center" size={14} className="profile-summary">
                <Avatar size={104} src={getAvatarUrl(avatar)} icon={<UserOutlined />} />

                <div className="profile-summary__name">{profile?.fullName}</div>
                <div className="profile-summary__email">{profile?.email}</div>

                <Space wrap>
                  <Tag color={profile?.role === 'ADMIN' ? 'blue' : 'green'}>{profile?.role}</Tag>
                  <Tag color={accountType === 'GOOGLE' ? 'purple' : 'default'}>{accountType}</Tag>
                </Space>
              </Space>

              <Divider />

              <Descriptions column={1} size="small" className="profile-info">
                <Descriptions.Item label="Email">{profile?.email}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {profile?.phone || 'Chưa cập nhật'}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  {profile?.isActive === false ? (
                    <Tag color="orange">Chưa kích hoạt</Tag>
                  ) : (
                    <Tag color="success">Đang hoạt động</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card className="profile-card" title="Thông tin cá nhân">
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleUpdateProfile}
                autoComplete="off"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Email">
                      <Input prefix={<MailOutlined />} value={profile?.email} disabled />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Họ tên"
                      name="fullName"
                      rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="Nhập họ tên" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone"
                      rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Avatar">
                      <Upload
                        customRequest={handleUploadAvatar}
                        beforeUpload={beforeUpload}
                        listType="picture"
                        maxCount={1}
                        fileList={fileList}
                        onRemove={() => {
                          setFileList([]);
                          setAvatar('');
                        }}
                      >
                        <Button icon={<CameraOutlined />}>Tải ảnh mới</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={isUpdatingProfile}
                >
                  Lưu thay đổi
                </Button>
              </Form>
            </Card>

            <Card className="profile-card profile-card--password" title="Đổi mật khẩu">
              {isGoogleAccount ? (
                <div className="profile-page__note">
                  Tài khoản Google không cần đổi mật khẩu trong hệ thống.
                </div>
              ) : (
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Mật khẩu hiện tại"
                    name="oldPassword"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                          { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                          { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                        ]}
                      >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới!' }]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LockOutlined />}
                    loading={isChangingPassword}
                  >
                    Đổi mật khẩu
                  </Button>
                </Form>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProfilePage;
