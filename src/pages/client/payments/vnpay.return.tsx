import { useEffect, useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyVnpayReturnAPI } from '@/services/api';

interface IVnpayReturnResult {
  success: boolean;
  message: string;
  orderCode?: string;
}

const VnpayReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<IVnpayReturnResult | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const res = await verifyVnpayReturnAPI(searchParams.toString());

        setResult(
          res.data || {
            success: false,
            message: 'Không nhận được kết quả thanh toán',
          },
        );
      } catch {
        setResult({
          success: false,
          message: 'Không thể kiểm tra kết quả thanh toán',
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (!result) {
    return <Spin fullscreen />;
  }

  return (
    <Result
      status={result.success ? 'success' : 'error'}
      title={result.message}
      subTitle={result.orderCode ? `Mã đơn hàng: ${result.orderCode}` : undefined}
      extra={[
        <Button key="orders" type="primary" onClick={() => navigate('/orders')}>
          Xem lịch sử đơn hàng
        </Button>,
        <Button key="home" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>,
      ]}
    />
  );
};

export default VnpayReturnPage;
