export const RECENTLY_VIEWED_KEY = 'bookstore_recently_viewed_books';
export const RECENTLY_VIEWED_EVENT = 'bookstore_recently_viewed_updated';
export const MAX_RECENTLY_VIEWED_BOOKS = 8;

export interface IRecentlyViewedBook {
  _id: string;
  mainText: string;
  author: string;
  price: number;
  thumbnail: string;
  category?: {
    _id: string;
    name: string;
  };
  viewedAt: string;
}

interface IBookLike {
  _id?: string;
  mainText?: string;
  author?: string;
  price?: number;
  thumbnail?: string;
  category?: {
    _id?: string;
    name?: string;
  };
  categoryId?: {
    _id?: string;
    name?: string;
  };
}

const isBrowser = typeof window !== 'undefined';

const isValidBook = (book: unknown): book is IRecentlyViewedBook => {
  if (!book || typeof book !== 'object') return false;

  const item = book as IRecentlyViewedBook;

  return Boolean(
    item._id && item.mainText && typeof item.price === 'number' && item.thumbnail && item.viewedAt,
  );
};

const normalizeCategory = (book: IBookLike) => {
  const category = book.category || book.categoryId;

  if (!category?._id || !category?.name) return undefined;

  return {
    _id: String(category._id),
    name: category.name,
  };
};

export const getRecentlyViewedBooks = (): IRecentlyViewedBook[] => {
  if (!isBrowser) return [];

  try {
    const rawData = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const parsedData = JSON.parse(rawData || '[]');

    if (!Array.isArray(parsedData)) return [];

    return parsedData.filter(isValidBook);
  } catch {
    return [];
  }
};

export const saveRecentlyViewedBook = (book: IBookLike) => {
  if (!isBrowser || !book?._id) return;

  const nextBook: IRecentlyViewedBook = {
    _id: String(book._id),
    mainText: book.mainText || 'Không có tên sách',
    author: book.author || 'Đang cập nhật',
    price: Number(book.price || 0),
    thumbnail: book.thumbnail || '',
    category: normalizeCategory(book),
    viewedAt: new Date().toISOString(),
  };

  const currentList = getRecentlyViewedBooks();

  const nextList = [nextBook, ...currentList.filter((item) => item._id !== nextBook._id)].slice(
    0,
    MAX_RECENTLY_VIEWED_BOOKS,
  );

  try {
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(nextList));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    // Ignore localStorage quota/private mode errors
  }
};
