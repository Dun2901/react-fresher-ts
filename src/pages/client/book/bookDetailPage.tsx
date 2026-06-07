// src/pages/client/book/detail/index.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Rate, Button, InputNumber, Divider, Image, message, Spin } from 'antd';
import { ShoppingCartOutlined, LoadingOutlined } from '@ant-design/icons';
import { getBookByIdAPI, addItemToCartAPI } from '@/services/api';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import { useCurrentApp } from 'components/context/app.context.tsx';
import axios from 'axios';
import './bookDetailPage.scss';

const BookDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { setCarts } = useCurrentApp();
    const [bookData, setBookData] = useState<IBookTable | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [currentImage, setCurrentImage] = useState<string>('');
    const [buyQuantity, setBuyQuantity] = useState<number>(1);

    useEffect(() => {
        const fetchBookDetail = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const res = await getBookByIdAPI(id);
                if (res && res.data) {
                    setBookData(res.data);
                    setCurrentImage(getBookImageUrl(res.data.thumbnail));
                }
            } catch (error) {
                message.error('Không thể lấy thông tin chi tiết sách');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBookDetail();
    }, [id]);

    //thêm vào giỏ hàng
    const handleAddToCart = async () => {
        if (!bookData) return;
        try {
            const res = await addItemToCartAPI(bookData._id, buyQuantity);
            if (res && res.data) {
                setCarts(res.data.items || []);
                message.success(`Đã thêm ${buyQuantity} cuốn vào giỏ hàng!`);
            }
        } catch (error) {
            let errorMsg = 'Không thể thêm vào giỏ hàng!';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.message || errorMsg;
            }
            message.error(errorMsg);
        }
    };

    if (isLoading) {
        return (
            <div className="detail-loading-container">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
                <p>Đang tải thông tin sách...</p>
            </div>
        );
    }

    if (!bookData) {
        return <div className="detail-error">Không tìm thấy sản phẩm yêu cầu.</div>;
    }

    // tạo mảng danh sách tất cả các ảnh (thumbnail + slider) để render hàng ảnh nhỏ bên dưới
    const allImages = [
        getBookImageUrl(bookData.thumbnail),
        ...(bookData.slider || []).map((img) => getBookImageUrl(img)),
    ];

    return (
        <div className="book-detail-page">
            <div className="detail-container">
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={10} className="image-gallery-section">
                        <div className="main-image-wrapper">
                            <Image src={currentImage} preview={true} alt={bookData.mainText} />
                        </div>
                        <div className="thumbnail-list">
                            {allImages.map((imgUrl, idx) => (
                                <div
                                    key={idx}
                                    className={`thumb-item ${currentImage === imgUrl ? 'active' : ''}`}
                                    onMouseEnter={() => setCurrentImage(imgUrl)}
                                >
                                    <img src={imgUrl} alt={`slide-${idx}`} />
                                </div>
                            ))}
                        </div>
                    </Col>

                    <Col xs={24} md={14} className="info-content-section">
                        <div className="author-tag">Tác giả: <span>{bookData.author || 'Chưa rõ'}</span></div>
                        <h1 className="product-title">{bookData.mainText}</h1>

                        <div className="rating-sold-row">
                            <Rate disabled defaultValue={4.5} allowHalf />
                            <Divider type="vertical" />
                            <span className="sold-text">Đã bán 128</span>
                        </div>

                        <div className="price-block">
                            <span className="current-price">{formatCurrency(bookData.price)}</span>
                            <span className="old-price">{formatCurrency(bookData.price * 1.25)}</span>
                            <span className="discount-tag">-25%</span>
                        </div>

                        <div className="shipping-info">
                            <span className="label">Vận chuyển:</span>
                            <span className="value">Miễn phí vận chuyển</span>
                        </div>

                        <Divider className="section-divider" />

                        <div className="quantity-selection-row">
                            <span className="label">Số lượng:</span>
                            <div className="quantity-controls">
                                <InputNumber
                                    min={1}
                                    max={bookData.quantity}
                                    value={buyQuantity}
                                    onChange={(value) => setBuyQuantity(value || 1)}
                                />
                                <span className="stock-count">{bookData.quantity} sản phẩm có sẵn</span>
                            </div>
                        </div>

                        <div className="action-buttons-group">
                            <Button
                                type="primary"
                                ghost
                                size="large"
                                icon={<ShoppingCartOutlined />}
                                className="btn-add-to-cart-full"
                                onClick={handleAddToCart}
                            >
                                Thêm vào giỏ hàng
                            </Button>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default BookDetailPage;