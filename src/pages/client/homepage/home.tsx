import React, {useEffect, useState} from 'react';
import {Row, Col, Card, Button, Tooltip, message, Space, Spin, Pagination} from 'antd';
import {ShoppingCartOutlined, EyeOutlined, LoadingOutlined} from '@ant-design/icons';
import { useCurrentApp } from 'components/context/app.context.tsx';
import './home.scss';
import { getBooksAPI } from "@/services/api.ts";


const Homepage: React.FC = () => {
    // Lấy dữ liệu giỏ hàng và hàm cập nhật từ Context chung
    const {carts, setCarts} = useCurrentApp();
    const [listBook, setListBook] = useState<IBookTable[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);


    //state quanr lý phân trang
    const [current, setCurrent] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(8);
    const [total, setTotal] = useState<number>(0);

    //kích hoạt api
    useEffect(() => {
        const loadBooks = async () => {
            setIsLoading(true);
            try {
                // tạo query
                const query = `current=${current}&pageSize=${pageSize}&sort=-createdAt`;
                const res = await getBooksAPI(query);
                if (res && res.data && res.data) {
                    setListBook(res.data.result || []);
                    setTotal(res.data.meta.total || 0);
                }
            } catch (error) {
                message.error("không thể kết nối với cơ sở dữ liệu");
                console.error("Lỗi tải sách từ DB", error);
            } finally {
                setIsLoading(false);

            }
        };
        loadBooks();

    }, [current, pageSize]);//tự động gọi lai API khi user đổi trang hoac size hiển thị

    //xử lý sự kiện khi người dùng click chuyển tranh
    const handlePaginationChange = (page: number, pSize: number) => {
        setCurrent(page);
        if (pSize !== pageSize) {
            setPageSize(pSize);
            setCurrent(1);//reset về trang đầu tiên nếu đổi số lượng item

        }
    };

    //thêm sách vào giỏ hàng, sử dụng id của MongoDB
    const handleAddToCart = (book: IBookTable) => {
        const cloneCarts = [...carts];
        // Tìm xem sách đã được mua trước đó chưa
        const findIndex = cloneCarts.findIndex(item => item.id === book._id);

        if (findIndex > -1) {
            // Đã có trong giỏ -> Tăng số lượng lên 1
            cloneCarts[findIndex].quantity += 1;
        } else {
            // Chưa có trong giỏ -> Thêm phần tử mới
            cloneCarts.push({
                id: book._id,
                title: book.mainText,
                price: book.price,
                thumbnail: book.thumbnail,
                quantity: 1
            });
        }

        // Cập nhật lại State Global -> Header tự động nhảy số theo
        setCarts(cloneCarts);
        message.success(`Đã thêm "${book.mainText}" vào giỏ hàng thành công!`);
    };

    return (
        <div className="homepage-shop">

            {/* Banner Quảng Cáo Khuyến Mãi */}
            <div className="shop-banner">
                <h1>Sách Hay Mỗi Ngày – Học Tập Đột Phá</h1>
                <p>Giảm giá lên đến 30% cho các đầu sách công nghệ trong tuần này. Mua ngay kẻo lỡ!</p>
            </div>

            <h2 className="section-title">Danh sách sách mới nhất</h2>

            <Spin spinning={isLoading} indicator={<LoadingOutlined style={{fontSize: 24}} spin/>}>
                <Row gutter={[20, 24]}>
                    {listBook.map((book) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={book._id}>
                            <Card
                                className="book-card"
                                hoverable
                                cover={
                                    <div className="book-image-wrapper">
                                        {/* nối link để hiển thị ảnh từ thư mục upload của Backend server */}
                                        <img
                                            alt={book.mainText}
                                            src={`${import.meta.env.VITE_BACKEND_URL}/images/book/${book.thumbnail}`}
                                            onError={(e) => {
                                                //anh dự phòng nếu link ảnh từ DB bị lỗi
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500";
                                            }}
                                        />
                                    </div>
                                }
                            >
                                <div className="book-title">{book.mainText}</div>
                                <div className="book-author">Tác giả: {book.author}</div>

                                <div className="book-meta">
                                    <div className="book-price">
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND'
                                        }).format(book.price)}
                                    </div>

                                    {/* Cụm nút bấm mua hàng */}
                                    <Space>
                                        <Tooltip title="Xem chi tiết">
                                            <Button
                                                shape="circle"
                                                icon={<EyeOutlined/>}
                                                onClick={() => message.info('Tính năng xem chi tiết đang phát triển!')}
                                            />
                                        </Tooltip>
                                        <Button
                                            type="primary"
                                            icon={<ShoppingCartOutlined/>}
                                            onClick={() => handleAddToCart(book)}
                                        >
                                            Mua
                                        </Button>
                                    </Space>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
                {/* Thanh điều hướng phân trang */}
                {listBook.length > 0 && (
                    <Row style={{marginTop: 40, justifyContent: 'center'}}>
                        <Pagination
                            current={current}
                            pageSize={pageSize}
                            total={total}
                            responsive={true}
                            showSizeChanger={true}
                            pageSizeOptions={['4', '8', '12', '16']}
                            onChange={handlePaginationChange}
                            showTotal={(total) => `Có tổng ${total} cuốn sách `}
                        />
                    </Row>
                )}
            </Spin>
        </div>

    );
};

export default Homepage;