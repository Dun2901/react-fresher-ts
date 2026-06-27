import React from 'react';
import { Skeleton, Tag } from 'antd';
import { FireOutlined, TagsOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, getBookImageUrl } from '@/services/helper';
import './RelatedBooks.scss';
import { getBackFromState, getBackLabelFromState, getCurrentPath } from '@/utils/navigation';

interface RelatedBooksProps {
  books: IBookTable[];
  isLoading?: boolean;
}

const FALLBACK_BOOK_IMAGE = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';

const RelatedBooks: React.FC<RelatedBooksProps> = ({ books, isLoading = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackFrom = getBackFromState(location.state) || '/book';
  const fallbackFromLabel = getBackLabelFromState(location.state) || 'danh sách sách';

  const handleViewDetail = (bookId: string) => {
    navigate(`/book/${bookId}`, {
      state: {
        from: getCurrentPath(location),
        fromLabel: 'sách trước đó',
        fallbackFrom,
        fallbackFromLabel,
      },
    });

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  if (!isLoading && books.length === 0) {
    return null;
  }

  return (
    <section className="related-books-section">
      <div className="related-books-section__header">
        <div>
          <h2>Có thể bạn cũng thích</h2>
          <p>Các sách cùng danh mục với sản phẩm đang xem</p>
        </div>
      </div>

      {isLoading ? (
        <div className="related-books-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="related-book-card related-book-card--skeleton" key={index}>
              <Skeleton.Image active className="related-book-card__skeleton-img" />
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="related-books-grid">
          {books.map((book) => {
            const isBestSeller = (book.sold ?? 0) > 0;

            return (
              <button
                type="button"
                className="related-book-card"
                key={book._id}
                onClick={() => handleViewDetail(book._id)}
                aria-label={`Xem chi tiết sách ${book.mainText}`}
              >
                <div className="related-book-card__image">
                  <img
                    src={getBookImageUrl(book.thumbnail) || FALLBACK_BOOK_IMAGE}
                    alt={book.mainText}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_BOOK_IMAGE;
                    }}
                  />
                </div>

                <div className="related-book-card__body">
                  <div className="related-book-card__tag-wrap">
                    <Tag
                      color={isBestSeller ? 'volcano' : 'blue'}
                      icon={isBestSeller ? <FireOutlined /> : <TagsOutlined />}
                    >
                      {isBestSeller ? 'Bán chạy' : 'Cùng danh mục'}
                    </Tag>
                  </div>

                  <h3 title={book.mainText}>{book.mainText}</h3>

                  <p className="related-book-card__author">
                    Tác giả: {book.author || 'Đang cập nhật'}
                  </p>

                  <div className="related-book-card__footer">
                    <strong>{formatCurrency(book.price)}</strong>
                    <span>{isBestSeller ? `Đã bán ${book.sold}` : 'Sách liên quan'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RelatedBooks;
