import dayjs from 'dayjs';

export const FORMATE_DATE = 'YYYY-MM-DD';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

const isExternalUrl = (url?: string) => {
  if (!url) return false;

  return /^https?:\/\//i.test(url);
};

const buildLocalFileUrl = (file?: string, folder?: string) => {
  if (!file) return '';

  if (isExternalUrl(file)) {
    return file;
  }

  if (file.startsWith('/')) {
    return `${BACKEND_URL}${file}`;
  }

  return `${BACKEND_URL}/images/${folder}/${file}`;
};

export const dateRangeValidate = (dateRange: any) => {
  if (!dateRange) return undefined;

  const startDate = dayjs(dateRange[0], FORMATE_DATE).toDate();
  const endDate = dayjs(dateRange[1], FORMATE_DATE).toDate();

  return [startDate, endDate];
};

export const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return undefined;

  return buildLocalFileUrl(avatar, 'avatar');
};

export const getBookImageUrl = (thumbnail?: string): string => {
  if (!thumbnail) return '';

  return buildLocalFileUrl(thumbnail, 'book');
};

export const getReviewMediaUrl = (url?: string): string => {
  if (!url) return '';

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

  if (url.startsWith('/')) {
    return `${BACKEND_URL}${url}`;
  }

  return `${BACKEND_URL}/images/review/${url}`;
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
