import dayjs from 'dayjs';

export const FORMATE_DATE = 'YYYY-MM-DD';

export const dateRangeValidate = (dateRange: any) => {
  if (!dateRange) return undefined;

  const startDate = dayjs(dateRange[0], FORMATE_DATE).toDate();
  const endDate = dayjs(dateRange[1], FORMATE_DATE).toDate();

  return [startDate, endDate];
};

export const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return undefined;

  const isExternalUrl = avatar.startsWith('http://') || avatar.startsWith('https://');

  if (isExternalUrl) {
    return avatar;
  }

  return `${import.meta.env.VITE_BACKEND_URL}/images/avatar/${avatar}`;
};

export const getBookImageUrl = (thumbnail?: string): string => {
  if (!thumbnail) return '';

  return thumbnail.startsWith('http')
    ? thumbnail
    : `${import.meta.env.VITE_BACKEND_URL}/images/book/${thumbnail}`;
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
