import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Row,
  Col,
  Button,
  message,
  Spin,
  Pagination,
  Layout,
  Checkbox,
  Slider,
  Divider,
  Drawer,
  Empty,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ShoppingCartOutlined,
  LoadingOutlined,
  FilterOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
  DownOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentApp } from 'components/context/app.context.tsx';
import { addItemToCartAPI, getBooksAPI, getCategoriesAPI } from '@/services/api.ts';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import axios from 'axios';
import './bookListPage.scss';
import { getCurrentPath } from '@/utils/navigation';

const { Sider, Content } = Layout;

const MAX_PRICE = 1000000;

const sortOptions = [
  { label: 'Mới nhất', value: '-createdAt' },
  { label: 'Giá thấp đến cao', value: 'price' },
  { label: 'Giá cao đến thấp', value: '-price' },
  { label: 'Bán chạy', value: '-sold' },
];

const BookListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, carts, setCarts } = useCurrentApp();

  const pageTopRef = useRef<HTMLDivElement | null>(null);

  const [listBook, setListBook] = useState<IBookTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);

  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);
  const [total, setTotal] = useState<number>(0);

  const [sort, setSort] = useState<string>('-createdAt');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);

  const [categoriesOptions, setCategoriesOptions] = useState<{ label: string; value: string }[]>(
    [],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategories.length > 0) {
      count += selectedCategories.length;
    }

    if (priceRange[0] > 0 || priceRange[1] < MAX_PRICE) {
      count += 1;
    }

    return count;
  }, [selectedCategories, priceRange]);

  const currentSortLabel = useMemo(() => {
    return sortOptions.find((item) => item.value === sort)?.label || 'Sắp xếp';
  }, [sort]);

  const sortMenuItems: MenuProps['items'] = sortOptions.map((item) => ({
    key: item.value,
    label: item.label,
  }));

  const showLoginRequiredMessage = () => {
    message.warning('Vui lòng đăng nhập để sử dụng chức năng này.');
  };

  const scrollToPageTop = () => {
    requestAnimationFrame(() => {
      const topPosition = pageTopRef.current
        ? pageTopRef.current.getBoundingClientRect().top + window.scrollY - 88
        : 0;

      window.scrollTo({
        top: Math.max(topPosition, 0),
        left: 0,
        behavior: 'auto',
      });
    });
  };

  useEffect(() => {
    scrollToPageTop();
  }, []);

  useEffect(() => {
    const loadBooks = async () => {
      setIsLoading(true);

      try {
        let query = `current=${current}&pageSize=${pageSize}&sort=${sort}`;

        if (selectedCategories.length > 0) {
          const categoryQuery = selectedCategories.map((id) => `category=${id}`).join('&');
          query += `&${categoryQuery}`;
        }

        if (priceRange[0] > 0) {
          query += `&price>=${priceRange[0]}`;
        }

        if (priceRange[1] < MAX_PRICE) {
          query += `&price<=${priceRange[1]}`;
        }

        const res = await getBooksAPI(query);

        if (res?.data) {
          const result = res.data.result || [];
          const metaTotal = res.data.meta?.total || 0;

          if (result.length === 0 && metaTotal > 0 && current > 1) {
            setCurrent(1);
            scrollToPageTop();
            return;
          }

          setListBook(result);
          setTotal(metaTotal);
        }
      } catch (error) {
        message.error('Không thể tải danh sách sách. Vui lòng thử lại sau.');
        console.error('Lỗi hệ thống:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, [current, pageSize, sort, selectedCategories, priceRange]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategoriesAPI('current=1&pageSize=100');

        if (res?.data?.result) {
          const dynamicCategories = res.data.result.map((cat: ICategory) => ({
            label: cat.name,
            value: cat._id,
          }));

          setCategoriesOptions(dynamicCategories);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh mục từ hệ thống:', error);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryChange = (checkedValues: Array<string | number>) => {
    setSelectedCategories(checkedValues.map(String));
    setCurrent(1);
  };

  const handlePriceChange = (value: number | number[]) => {
    if (!Array.isArray(value)) {
      return;
    }

    const [minPrice, maxPrice] = value;

    setPriceRange([Number(minPrice), Number(maxPrice)]);
    setCurrent(1);
  };

  const handleSortChange = (value: string) => {
    scrollToPageTop();
    setSort(value);
    setCurrent(1);
  };

  const handleSortMenuClick: MenuProps['onClick'] = ({ key }) => {
    handleSortChange(String(key));
  };

  const handlePaginationChange = (page: number, pSize: number) => {
    scrollToPageTop();

    if (pSize !== pageSize) {
      setPageSize(pSize);
      setCurrent(1);
      return;
    }

    setCurrent(page);
  };

  const handleResetFilter = () => {
    scrollToPageTop();
    setSelectedCategories([]);
    setPriceRange([0, MAX_PRICE]);
    setSort('-createdAt');
    setCurrent(1);
  };

  const handleApplyMobileFilter = () => {
    setIsFilterDrawerOpen(false);
    scrollToPageTop();
  };

  const handleAddToCart = async (book: IBookTable) => {
    if (!isAuthenticated) {
      showLoginRequiredMessage();
      return;
    }

    try {
      const res = await addItemToCartAPI(book._id, 1);

      if (res?.data) {
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

  const renderFilterContent = () => {
    return (
      <div className="filter-content">
        <div className="filter-header">
          <FilterOutlined />
          <span>Bộ lọc tìm kiếm</span>
        </div>

        <Divider className="filter-divider-sm" />

        <div className="filter-group">
          <h4>Danh mục sách</h4>

          {categoriesOptions.length > 0 ? (
            <Checkbox.Group
              options={categoriesOptions}
              value={selectedCategories}
              onChange={handleCategoryChange}
              className="vertical-checkbox-group"
            />
          ) : (
            <div className="filter-empty-text">Chưa có danh mục</div>
          )}
        </div>

        <Divider className="filter-divider-md" />

        <div className="filter-group">
          <h4>Khoảng giá</h4>

          <Slider
            range
            min={0}
            max={MAX_PRICE}
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

        <Button icon={<ReloadOutlined />} block onClick={handleResetFilter}>
          Xóa bộ lọc
        </Button>

        <Button
          type="primary"
          block
          className="mobile-apply-filter-btn"
          onClick={handleApplyMobileFilter}
        >
          Xem kết quả
        </Button>
      </div>
    );
  };

  return (
    <div className="book-list-shop-page" ref={pageTopRef}>
      <Layout className="shop-main-layout">
        <Sider width={260} className="shop-sidebar-filter" trigger={null}>
          {renderFilterContent()}
        </Sider>

        <Content className="shop-content-products">
          <div className="content-title-wrapper">
            <div className="content-heading">
              <h2 className="section-title">Tất cả sách</h2>
              <p className="section-subtitle">
                {total > 0
                  ? `Tìm thấy ${total} cuốn sách`
                  : 'Khám phá danh sách sách trong hệ thống'}
              </p>
            </div>

            <div className="content-actions">
              <Button
                className="mobile-filter-btn"
                icon={<FilterOutlined />}
                onClick={() => setIsFilterDrawerOpen(true)}
              >
                Bộ lọc
                {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
              </Button>

              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: sortMenuItems,
                  selectedKeys: [sort],
                  onClick: handleSortMenuClick,
                }}
              >
                <Button className="sort-dropdown-btn" icon={<SortAscendingOutlined />}>
                  <span className="sort-dropdown-btn__text">{currentSortLabel}</span>
                  <DownOutlined className="sort-dropdown-btn__arrow" />
                </Button>
              </Dropdown>
            </div>
          </div>

          <Spin
            spinning={isLoading}
            indicator={<LoadingOutlined className="spin-loading-icon" spin />}
          >
            {!isLoading && listBook.length === 0 ? (
              <div className="book-empty-wrapper">
                <Empty description="Không tìm thấy sách phù hợp" />
                <Button type="primary" icon={<ReloadOutlined />} onClick={handleResetFilter}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <Row gutter={[6, 8]} className="book-product-grid">
                {listBook.map((book) => {
                  const inCart = carts.some((item) => item.bookId?._id === book._id);
                  const averageRating = book.averageRating ?? 0;
                  const reviewCount = book.reviewCount ?? 0;
                  const sold = book.sold ?? 0;
                  const isBestSeller = sold > 0;

                  return (
                    <Col xs={12} sm={8} md={6} lg={6} xl={4} xxl={4} key={book._id}>
                      <div
                        className="book-card-mobile-shop"
                        onClick={() =>
                          navigate(`/book/${book._id}`, {
                            state: {
                              from: getCurrentPath(location),
                              fromLabel: 'danh sách sách',
                            },
                          })
                        }
                      >
                        <div className="book-card-mobile-shop__img">
                          <img
                            alt={book.mainText}
                            src={getBookImageUrl(book.thumbnail)}
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';
                            }}
                          />

                          {isBestSeller && (
                            <span className="book-card-mobile-shop__badge">Bán chạy</span>
                          )}
                        </div>

                        <div className="book-card-mobile-shop__body">
                          <div className="book-card-mobile-shop__title" title={book.mainText}>
                            {book.mainText}
                          </div>

                          <div className="book-card-mobile-shop__author">
                            {book.author || 'Đang cập nhật'}
                          </div>

                          <div className="book-card-mobile-shop__meta">
                            <span>
                              <StarFilled /> {reviewCount > 0 ? averageRating.toFixed(1) : 'Mới'}
                            </span>

                            <span>{sold > 0 ? `${sold} đã bán` : 'Mới cập nhật'}</span>
                          </div>

                          <div className="book-card-mobile-shop__bottom">
                            <div className="book-card-mobile-shop__price">
                              {formatCurrency(book.price)}
                            </div>

                            <button
                              type="button"
                              className={`book-card-mobile-shop__cart ${
                                inCart ? 'book-card-mobile-shop__cart--incart' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(book);
                              }}
                              aria-label={inCart ? 'Mua thêm' : 'Thêm vào giỏ hàng'}
                              title={inCart ? 'Mua thêm' : 'Thêm vào giỏ hàng'}
                            >
                              <ShoppingCartOutlined className="book-card-mobile-shop__cart-icon" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}

            {listBook.length > 0 && (
              <Row className="pagination-wrapper">
                <Pagination
                  current={current}
                  pageSize={pageSize}
                  total={total}
                  responsive
                  showSizeChanger
                  pageSizeOptions={['12', '18', '24', '30']}
                  onChange={handlePaginationChange}
                  showTotal={(totalBooks) => `Tổng ${totalBooks} sách`}
                />
              </Row>
            )}
          </Spin>
        </Content>
      </Layout>

      <Drawer
        title="Bộ lọc sách"
        placement="left"
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        width="86%"
        className="mobile-filter-drawer"
      >
        {renderFilterContent()}
      </Drawer>
    </div>
  );
};

export default BookListPage;
