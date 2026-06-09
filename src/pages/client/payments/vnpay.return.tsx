import { useEffect, useState } from 'react';
import { Button, Result, Spin, Space, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { fetchMyCartAPI, verifyVnpayReturnAPI } from '@/services/api';
import { useCurrentApp } from 'components/context/app.context.tsx';

const { Text } = Typography;

interface IVnpayReturnResult {
  success: boolean;
  message: string;
  orderCode?: string;
}

const VnpayReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCarts } = useCurrentApp();

  const [result, setResult] = useState<IVnpayReturnResult | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await verifyVnpayReturnAPI(searchParams.toString());

        const paymentResult = res.data || {
          success: false,
          message: 'Không nhận được kết quả thanh toán',
        };

        setResult(paymentResult);

        if (paymentResult.success) {
          try {
            const cartRes = await fetchMyCartAPI();
            setCarts(cartRes.data?.items || []);
          } catch {
            // Nếu sync cart lỗi thì vẫn hiển thị kết quả thanh toán.
            // User có thể reload lại trang, AppProvider sẽ tự fetch cart lại.
            setCarts([]);
          }
        }
      } catch {
        setResult({
          success: false,
          message: 'Không thể kiểm tra kết quả thanh toán',
        });
      }
    };

    verifyPayment();
  }, [searchParams, setCarts]);

  if (!result) {
    return <Spin fullscreen />;
  }

  return (
    <Result
      status={result.success ? 'success' : 'error'}
      title={result.message}
      subTitle={
        result.orderCode ? (
          <Space direction="vertical">
            <Text>
              Mã đơn hàng:{' '}
              <Text strong type="warning">
                {result.orderCode}
              </Text>
            </Text>
            {result.success && (
              <Text type="secondary">
                Giỏ hàng đã được đồng bộ lại sau khi thanh toán thành công.
              </Text>
            )}
          </Space>
        ) : undefined
      }
      extra={[
        <Button key="orders" type="primary" onClick={() => navigate('/orders')}>
          Xem đơn hàng
        </Button>,
        <Button key="cart" onClick={() => navigate('/cart')}>
          Xem giỏ hàng
        </Button>,
        <Button key="home" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>,
      ]}
    />
  );
};

export default VnpayReturnPage;
