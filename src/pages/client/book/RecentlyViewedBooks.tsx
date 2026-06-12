import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRecentlyViewedBooks,
  IRecentlyViewedBook,
  RECENTLY_VIEWED_EVENT,
} from '@/utils/recentlyViewed';

interface IProps {
  currentBookId?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const formatPrice = (price: number) => {
  return `${new Intl.NumberFormat('vi-VN').format(price)}đ`;
};

const getBookImageUrl = (thumbnail: string) => {
  if (!thumbnail) return '/default-book.png';

  if (thumbnail.startsWith('http')) {
    return thumbnail;
  }

  return `${BACKEND_URL}/images/book/${thumbnail}`;
};

const RecentlyViewedBooks = ({ currentBookId }: IProps) => {
  const [books, setBooks] = useState<IRecentlyViewedBook[]>([]);

  const syncRecentlyViewedBooks = () => {
    setBooks(getRecentlyViewedBooks());
  };

  useEffect(() => {
    syncRecentlyViewedBooks();

    window.addEventListener('storage', syncRecentlyViewedBooks);
    window.addEventListener(RECENTLY_VIEWED_EVENT, syncRecentlyViewedBooks);

    return () => {
      window.removeEventListener('storage', syncRecentlyViewedBooks);
      window.removeEventListener(RECENTLY_VIEWED_EVENT, syncRecentlyViewedBooks);
    };
  }, [currentBookId]);

  const displayBooks = useMemo(() => {
    return books.filter((book) => book._id !== currentBookId).slice(0, 8);
  }, [books, currentBookId]);

  if (!displayBooks.length) return null;

  return (
    <section className="recently-viewed">
      <div className="recently-viewed__head">
        <h2>Đã xem gần đây</h2>
        <span>Các sách bạn vừa ghé qua</span>
      </div>

      <div className="recently-viewed__grid">
        {displayBooks.map((book) => (
          <Link key={book._id} to={`/book/${book._id}`} className="recently-viewed__item">
            <div className="recently-viewed__image-wrap">
              <img
                src={getBookImageUrl(book.thumbnail)}
                alt={book.mainText}
                className="recently-viewed__image"
                loading="lazy"
              />
            </div>

            <div className="recently-viewed__body">
              <h3>{book.mainText}</h3>
              <p>{book.author}</p>

              <div className="recently-viewed__bottom">
                <strong>{formatPrice(book.price)}</strong>

                {book.category?.name && <span>{book.category.name}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedBooks;
