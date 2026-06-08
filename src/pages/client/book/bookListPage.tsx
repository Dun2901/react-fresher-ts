import React, { useEffect, useState } from 'react';
import {
    Row,
    Col,
    Card,
    Button,
    Tooltip,
    message,
    Spin,
    Pagination,
    Layout,
    Checkbox,
    Slider,
    Rate,
    Divider,
    Badge,
} from 'antd';
import {
    ShoppingCartOutlined,
    EyeOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context.tsx';
import { addItemToCartAPI, getBooksAPI, getCategoriesAPI} from '@/services/api.ts';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import axios from 'axios';
import './bookListPage.scss';

const { Sider, Content } = Layout;

const BookListPage: React.FC = () => {
    const navigate = useNavigate();
    const { carts, setCarts } = useCurrentApp();
    const [listBook, setListBook] = useState<IBookTable[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // quản lý phân trang
    const [current, setCurrent] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(8);
    const [total, setTotal] = useState<number>(0);

    // bộ lọc tìm kiếm
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);

    const [categoriesOptions, setCategoriesOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const loadBooks = async () => {
            setIsLoading(true);
            try {
                let query = `current=${current}&pageSize=${pageSize}&sort=-createdAt`;

                if (selectedCategories.length > 0) {
                    const categoryQuery = selectedCategories.map(id => `category=${id}`).join('&');
                    query += `&${categoryQuery}`;
                }
                //lọc khoảng giá
                if (priceRange[0] > 0) query += `&price>=${priceRange[0]}`;
                if (priceRange[1] < 500000) query += `&price<=${priceRange[1]}`;


                const res = await getBooksAPI(query);
                if (res && res.data) {
                    if (res.data.result.length === 0 && res.data.meta.total > 0) {
                        setCurrent(1);
                    }else {
                        setListBook(res.data.result || []);
                        setTotal(res.data.meta.total || 0);
                    }
                }
            } catch (error) {
                message.error('Không thể kết nối với cơ sở dữ liệu');
                console.error('Lỗi hệ thống:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBooks();
    }, [current, pageSize, selectedCategories, priceRange]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await getCategoriesAPI('current=1&pageSize=100');

                if (res && res.data && res.data.result) {
                    const dynamicCategories = res.data.result.map((cat: any) => {
                        return {
                            label: cat.name,
                            value: cat._id,
                        };
                    });

                    setCategoriesOptions(dynamicCategories);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh mục từ hệ thống:', error);
            }
        };
        loadCategories();
    }, []);

    // xử lý thay đổi checkbox danh mục
    const handleCategoryChange = (checkedValues: any) => {
        setSelectedCategories(checkedValues as string[]);
    };

    //xử lý thay đổi giá
    const handlePriceChange = (value: [number, number]) => {
        setPriceRange(value);
    };

    const handlePaginationChange = (page: number, pSize: number) => {
        setCurrent(page);
        if (pSize !== pageSize) {
            setPageSize(pSize);
            setCurrent(1);
        }
    };

    const handleAddToCart = async (book: IBookTable) => {
        try {
            const res = await addItemToCartAPI(book._id, 1);
            if (res && res.data) {
                setCarts(res.data.items || []);
                message.success(`Đã thêm "${book.mainText}" vào giỏ hàng!`);
            }
        } catch (error) {
            let errorMsg = 'Không thể thêm sản phẩm vào giỏ hàng!';
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.message || errorMsg;
            }
            message.error(errorMsg);
        }
    };

    return (
        <div className="book-list-shop-page">
            <Layout className="shop-main-layout">
                <Sider width={260} className="shop-sidebar-filter" breakpoint="lg" collapsedWidth="0" trigger={null}>
                    <div className="filter-header">
                        <ShoppingCartOutlined /> <span>BỘ LỌC TÌM KIẾM</span>
                    </div>
                    <Divider className="filter-divider-sm" />

                    <div className="filter-group">
                        <h4>Danh mục sản phẩm</h4>
                        <Checkbox.Group
                            options={categoriesOptions}
                            value={selectedCategories}
                            onChange={handleCategoryChange}
                            className="vertical-checkbox-group"
                        />
                    </div>
                    <Divider className="filter-divider-md" />

                    <div className="filter-group">
                        <h4>Khoảng giá (VNĐ)</h4>
                        <Slider
                            range
                            min={0}
                            max={500000}
                            step={10000}
                            value={priceRange}
                            onChange={handlePriceChange}
                            tooltip={{ formatter: (v) => `${v?.toLocaleString('vi-VN')}đ` }}
                        />
                        <div className="price-range-label">
                            <span>{priceRange[0].toLocaleString('vi-VN')}đ</span>
                            <span>-</span>
                            <span>{priceRange[1].toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                    <Divider className="filter-divider-md" />

                    <div className="filter-group">
                        <h4>Đánh giá từ khách hàng</h4>
                        <div className="rating-filter-item"><Rate disabled defaultValue={5} /> <span>(Từ 5 sao)</span></div>
                        <div className="rating-filter-item"><Rate disabled defaultValue={4} /> <span>(Từ 4 sao)</span></div>
                        <div className="rating-filter-item"><Rate disabled defaultValue={3} /> <span>(Từ 3 sao)</span></div>
                    </div>
                </Sider>

                <Content className="shop-content-products">
                    <div className="content-title-wrapper">
                        <h2 className="section-title">Tất cả sản phẩm sách</h2>
                    </div>

                    <Spin spinning={isLoading} indicator={<LoadingOutlined className="spin-loading-icon" spin />}>
                        <Row gutter={[16, 20]}>
                            {listBook.map((book, index) => {
                                const hasDiscount = index % 2 === 0;
                                const discountPercent = hasDiscount ? (index % 4 === 0 ? 25 : 15) : 0;
                                const fakeRate = index % 3 === 0 ? 5 : 4.5;

                                const innerCard = (
                                    <Card
                                        className="book-card-premium"
                                        hoverable
                                        styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' } }}
                                        cover={
                                            <div className="book-image-container">
                                                <img
                                                    alt={book.mainText}
                                                    src={getBookImageUrl(book.thumbnail)}
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';
                                                    }}
                                                />
                                            </div>
                                        }
                                    >
                                        <div className="book-meta-data">
                                            <div className="book-title-text" title={book.mainText}>{book.mainText}</div>
                                            <div className="book-author-text">Tác giả: {book.author}</div>
                                            <div className="book-rating-sold">
                                                <Rate disabled allowHalf defaultValue={fakeRate} />
                                                <span className="sold-count">Đã bán {book.sold ?? 0}</span>
                                            </div>

                                            <div className="book-card-footer">
                                                <div className="price-section">
                                                    <span className="current-price">{formatCurrency(book.price)}</span>
                                                    {discountPercent > 0 && (
                                                        <span className="old-price">{formatCurrency(book.price * (1 + discountPercent / 100))}</span>
                                                    )}
                                                </div>

                                                <div className="action-buttons">
                                                    <Tooltip title="Xem chi tiết">
                                                        <Button
                                                            className="btn-view"
                                                            shape="circle"
                                                            icon={<EyeOutlined />}
                                                            onClick={() => navigate(`/book/${book._id}`)}
                                                        />
                                                    </Tooltip>
                                                    <Button
                                                        type="primary"
                                                        className={`btn-action-cart ${carts.some((item) => item.bookId._id === book._id) ? 'btn-buy-more' : ''}`}
                                                        danger={carts.some((item) => item.bookId._id === book._id)}
                                                        icon={<ShoppingCartOutlined />}
                                                        onClick={() => handleAddToCart(book)}
                                                    >
                                                        {carts.some((item) => item.bookId._id === book._id) ? 'Mua tiếp' : 'Mua'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );

                                return (
                                    <Col xs={24} sm={12} md={12} lg={8} xl={6} key={book._id}>
                                        {discountPercent > 0 ? (
                                            <Badge.Ribbon text={`-${discountPercent}%`} color="red" className="discount-ribbon">
                                                {innerCard}
                                            </Badge.Ribbon>
                                        ) : (
                                            innerCard
                                        )}
                                    </Col>
                                );
                            })}
                        </Row>

                        {/* Thanh điều hướng phân trang */}
                        {listBook.length > 0 && (
                            <Row className="pagination-wrapper">
                                <Pagination
                                    current={current}
                                    pageSize={pageSize}
                                    total={total}
                                    responsive={true}
                                    showSizeChanger={true}
                                    pageSizeOptions={['4', '8', '12', '16']}
                                    onChange={handlePaginationChange}
                                    showTotal={(total) => `Hiển thị ${listBook.length}/${total} cuốn sách`}
                                />
                            </Row>
                        )}
                    </Spin>
                </Content>
            </Layout>
        </div>
    );
};

export default BookListPage;