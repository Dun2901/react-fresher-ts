import React from 'react';
import { Row, Col, Card, Button, Tooltip, message, Space } from 'antd'; // 🛠️ Đã thêm Space và xóa Badge thừa
import { ShoppingCartOutlined, EyeOutlined } from '@ant-design/icons';
import { useCurrentApp } from 'components/context/app.context.tsx';
import './home.scss';

// Định nghĩa cấu trúc dữ liệu Sách mẫu
interface BookType {
    id: string;
    title: string;
    author: string;
    price: number;
    thumbnail: string;
    category: string;
}

const Homepage: React.FC = () => {
    // Lấy dữ liệu giỏ hàng và hàm cập nhật từ Context chung
    const { carts, setCarts } = useCurrentApp();

    // Dữ liệu Sách giả lập (Mock Data) kèm link ảnh thật để test giao diện
    const mockBooks: BookType[] = [
        { id: 'M001', title: 'Học ReactJS Mới Nhất Trong 21 Ngày', author: 'Hỏi Dân !T', price: 185000, category: 'Công nghệ', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&auto=format&fit=crop&q=60' },
        { id: 'M002', title: 'Làm Chủ NestJS & Học Phần Cử Nhân', author: 'Eric Nguyễn', price: 299000, category: 'Công nghệ', thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=60' },
        { id: 'M003', title: 'Tâm Lý Học Thành Công & Đột Phá', author: 'Carol S. Dweck', price: 145000, category: 'Kỹ năng', thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60' },
        { id: 'M004', title: 'Đắc Nhân Tâm - Bí Quyết Thành Công', author: 'Dale Carnegie', price: 92000, category: 'Kỹ năng', thumbnail: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60' },
        { id: 'M005', title: 'Node.js Cơ Bản Dành Cho Bản Thân', author: 'Hỏi Dân !T', price: 210000, category: 'Công nghệ', thumbnail: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=60' },
        { id: 'M006', title: 'Thiết Kế Cơ Sở Dữ Lượng Lớn (SQL)', author: 'Trần Văn B', price: 320000, category: 'Công nghệ', thumbnail: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500&auto=format&fit=crop&q=60' },
    ];

    // Logic thêm sách vào giỏ hàng (Chạy offline thuần Frontend)
    const handleAddToCart = (book: BookType) => {
        const cloneCarts = [...carts];
        // Tìm xem sách đã được mua trước đó chưa
        const findIndex = cloneCarts.findIndex(item => item.id === book.id);

        if (findIndex > -1) {
            // Đã có trong giỏ -> Tăng số lượng lên 1
            cloneCarts[findIndex].quantity += 1;
        } else {
            // Chưa có trong giỏ -> Thêm phần tử mới
            cloneCarts.push({
                id: book.id,
                title: book.title,
                price: book.price,
                thumbnail: book.thumbnail,
                quantity: 1
            });
        }

        // Cập nhật lại State Global -> Header tự động nhảy số theo
        setCarts(cloneCarts);
        message.success(`Đã thêm "${book.title}" vào giỏ hàng thành công!`);
    };

    return (
        <div className="homepage-shop">

            {/* Banner Quảng Cáo Khuyến Mãi */}
            <div className="shop-banner">
                <h1>Sách Hay Mỗi Ngày – Học Tập Đột Phá 📚</h1>
                <p>Giảm giá lên đến 30% cho các đầu sách công nghệ trong tuần này. Mua ngay kẻo lỡ!</p>
            </div>

            <h2 className="section-title">Danh sách sách mới nhất</h2>

            {/* Grid hiển thị danh sách sách (Responsive tự động) */}
            <Row gutter={[20, 24]}>
                {mockBooks.map((book) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                        <Card
                            className="book-card"
                            hoverable
                            cover={
                                <div className="book-image-wrapper">
                                    <img alt={book.title} src={book.thumbnail} />
                                </div>
                            }
                        >
                            <div className="book-title">{book.title}</div>
                            <div className="book-author">Tác giả: {book.author}</div>

                            <div className="book-meta">
                                <div className="book-price">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
                                </div>

                                {/* Cụm nút bấm mua hàng */}
                                <Space>
                                    <Tooltip title="Xem chi tiết">
                                        <Button
                                            shape="circle"
                                            icon={<EyeOutlined />}
                                            onClick={() => message.info('Tính năng xem chi tiết đang phát triển!')}
                                        />
                                    </Tooltip>
                                    <Button
                                        type="primary"
                                        icon={<ShoppingCartOutlined />}
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
        </div>
    );
};

export default Homepage;