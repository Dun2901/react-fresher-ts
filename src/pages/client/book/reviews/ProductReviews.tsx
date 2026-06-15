import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Empty,
  Image,
  Input,
  Modal,
  Pagination,
  Rate,
  Spin,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  DeleteOutlined,
  EditOutlined,
  LeftOutlined,
  LikeOutlined,
  LoadingOutlined,
  MoreOutlined,
  RightOutlined,
  StarFilled,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  createReviewAPI,
  deleteReviewAPI,
  getMyReviewsByBookAPI,
  getReviewsByBookAPI,
  markReviewHelpfulAPI,
  updateReviewAPI,
  uploadReviewMediaAPI,
} from '@/services/api';
import { getAvatarUrl, getReviewMediaUrl } from '@/services/helper';
import { useCurrentApp } from 'components/context/app.context.tsx';

import './ProductReviews.scss';

type TReviewFilter = 'all' | '5' | '4' | '3' | '2' | '1' | 'comment' | 'media';

type TReviewSummary = IReviewSummary & {
  commentCount?: number;
  mediaCount?: number;
};

type TSelectedReviewMedia = Record<string, number>;

type ProductReviewsProps = {
  book: IBookTable;
  onSummaryChange?: (summary: IReviewSummary) => void;
};

type TBackendError = {
  error?: {
    message?: string | string[];
    statusCode?: number;
  };
  message?: string | string[];
  statusCode?: number;
};

type TReviewSellerReply = {
  sellerReply?: string;
};

const PAGE_SIZE = 5;

const DEFAULT_SUMMARY: TReviewSummary = {
  averageRating: 0,
  reviewCount: 0,
  commentCount: 0,
  mediaCount: 0,
  ratingSummary: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
};

const getMessageValue = (messageValue?: string | string[]) => {
  if (Array.isArray(messageValue)) {
    return messageValue[0];
  }

  return messageValue;
};

const normalizeAxiosMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as TBackendError | undefined;

    return getMessageValue(data?.error?.message) || getMessageValue(data?.message) || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  const data = error as TBackendError | undefined;

  return getMessageValue(data?.error?.message) || getMessageValue(data?.message) || fallback;
};

const throwIfBackendError = (response: unknown) => {
  const data = response as TBackendError | undefined;
  const statusCode = data?.error?.statusCode || data?.statusCode;

  if (statusCode && statusCode >= 400) {
    throw new Error(
      getMessageValue(data?.error?.message) ||
        getMessageValue(data?.message) ||
        'Có lỗi xảy ra, vui lòng thử lại.',
    );
  }

  if (data?.error) {
    throw new Error(getMessageValue(data.error.message) || 'Có lỗi xảy ra, vui lòng thử lại.');
  }
};

const getUserInfo = (review: IReview) => {
  if (typeof review.userId === 'string') {
    return {
      _id: review.userId,
      fullName: 'Người dùng BookStore',
      avatar: undefined,
    };
  }

  return review.userId;
};

const getOrderCode = (review: IReview) => {
  if (typeof review.orderId === 'string') {
    return '';
  }

  return review.orderId?.orderCode || '';
};

const getUploadMediaType = (file: File): TReviewMediaType => {
  if (file.type.startsWith('video/')) {
    return 'VIDEO';
  }

  return 'IMAGE';
};

const getSellerReply = (review: IReview) => {
  const reviewWithReply = review as IReview & TReviewSellerReply;

  return reviewWithReply.sellerReply || '';
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ book, onSummaryChange }) => {
  const { isAuthenticated, user } = useCurrentApp();

  const reviewSectionRef = useRef<HTMLElement | null>(null);

  const [reviews, setReviews] = useState<IReview[]>([]);
  const [myReviews, setMyReviews] = useState<IReview[]>([]);
  const [summary, setSummary] = useState<TReviewSummary>(DEFAULT_SUMMARY);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeFilter, setActiveFilter] = useState<TReviewFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<IReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMediaByReview, setSelectedMediaByReview] = useState<TSelectedReviewMedia>({});

  const normalizedSummary = useMemo<TReviewSummary>(() => {
    return {
      averageRating: summary.averageRating || 0,
      reviewCount: summary.reviewCount || 0,
      commentCount: summary.commentCount || 0,
      mediaCount: summary.mediaCount || 0,
      ratingSummary: {
        1: summary.ratingSummary?.[1] || 0,
        2: summary.ratingSummary?.[2] || 0,
        3: summary.ratingSummary?.[3] || 0,
        4: summary.ratingSummary?.[4] || 0,
        5: summary.ratingSummary?.[5] || 0,
      },
    };
  }, [summary]);

  const filterItems = useMemo(
    () => [
      { key: 'all' as const, label: 'Tất Cả' },
      { key: '5' as const, label: `5 Sao (${normalizedSummary.ratingSummary[5]})` },
      { key: '4' as const, label: `4 Sao (${normalizedSummary.ratingSummary[4]})` },
      { key: '3' as const, label: `3 Sao (${normalizedSummary.ratingSummary[3]})` },
      { key: '2' as const, label: `2 Sao (${normalizedSummary.ratingSummary[2]})` },
      { key: '1' as const, label: `1 Sao (${normalizedSummary.ratingSummary[1]})` },
      {
        key: 'comment' as const,
        label: `Có Bình Luận (${normalizedSummary.commentCount || 0})`,
      },
      {
        key: 'media' as const,
        label: `Có Hình Ảnh / Video (${normalizedSummary.mediaCount || 0})`,
      },
    ],
    [normalizedSummary],
  );

  const displayReviews = useMemo(() => {
    if (activeFilter !== 'all' || myReviews.length === 0) {
      return reviews;
    }

    const myReviewIds = new Set(myReviews.map((review) => review._id));
    const otherReviews = reviews.filter((review) => !myReviewIds.has(review._id));

    return [...myReviews, ...otherReviews];
  }, [activeFilter, myReviews, reviews]);

  const scrollToReviewSection = () => {
    const element = reviewSectionRef.current;

    if (!element) {
      return;
    }

    const headerOffset = window.innerWidth <= 768 ? 72 : 92;
    const elementTop = element.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(elementTop - headerOffset, 0);

    window.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  };

  const handleFilterChange = (filter: TReviewFilter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    setSelectedMediaByReview({});

    window.setTimeout(() => {
      scrollToReviewSection();
    }, 0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedMediaByReview({});

    window.setTimeout(() => {
      scrollToReviewSection();
    }, 0);
  };

  const getSelectedMediaIndex = (reviewId: string, mediaLength: number) => {
    const selectedIndex = selectedMediaByReview[reviewId];

    if (selectedIndex === undefined || selectedIndex < 0 || selectedIndex >= mediaLength) {
      return -1;
    }

    return selectedIndex;
  };

  const handleSelectMedia = (reviewId: string, mediaIndex: number) => {
    setSelectedMediaByReview((prev) => ({
      ...prev,
      [reviewId]: prev[reviewId] === mediaIndex ? -1 : mediaIndex,
    }));
  };

  const handleMoveMedia = (reviewId: string, mediaLength: number, direction: -1 | 1) => {
    if (mediaLength <= 1) {
      return;
    }

    setSelectedMediaByReview((prev) => {
      const currentIndex = prev[reviewId] ?? 0;
      const safeCurrentIndex = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = (safeCurrentIndex + direction + mediaLength) % mediaLength;

      return {
        ...prev,
        [reviewId]: nextIndex,
      };
    });
  };

  const fetchReviews = async (page = currentPage, filterValue = activeFilter) => {
    if (!book?._id) {
      return;
    }

    const query = new URLSearchParams({
      current: String(page),
      pageSize: String(PAGE_SIZE),
      sort: 'newest',
    });

    if (['1', '2', '3', '4', '5'].includes(filterValue)) {
      query.set('rating', filterValue);
    }

    if (filterValue === 'media') {
      query.set('hasMedia', 'true');
    }

    if (filterValue === 'comment') {
      query.set('hasComment', 'true');
    }

    setIsLoading(true);

    try {
      const res = await getReviewsByBookAPI(book._id, query.toString());

      throwIfBackendError(res);

      if (res.data) {
        const nextSummary: TReviewSummary = {
          ...DEFAULT_SUMMARY,
          ...(res.data.summary || {}),
          ratingSummary: {
            ...DEFAULT_SUMMARY.ratingSummary,
            ...(res.data.summary?.ratingSummary || {}),
          },
        };

        setReviews(res.data.result || []);
        setTotal(res.data.meta?.total || 0);
        setSummary(nextSummary);
        onSummaryChange?.(nextSummary);
      }
    } catch (error) {
      message.error(normalizeAxiosMessage(error, 'Không thể tải đánh giá sản phẩm.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    if (!book?._id || !isAuthenticated) {
      setMyReviews([]);
      return;
    }

    try {
      const res = await getMyReviewsByBookAPI(book._id);

      throwIfBackendError(res);

      setMyReviews(res.data || []);
    } catch {
      setMyReviews([]);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setActiveFilter('all');
    setSelectedMediaByReview({});
    setMyReviews([]);
  }, [book?._id]);

  useEffect(() => {
    fetchReviews();
    fetchMyReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?._id, currentPage, activeFilter, isAuthenticated]);

  const openCreateModal = () => {
    if (!isAuthenticated) {
      message.warning('Bạn cần đăng nhập để đánh giá sản phẩm.');
      return;
    }

    setEditingReview(null);
    setRating(5);
    setComment('');
    setFileList([]);
    setIsModalOpen(true);
  };

  const openEditModal = (review: IReview) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || '');
    setFileList(
      (review.media || []).map((media, index) => ({
        uid: `${media.url}-${index}`,
        name: media.type === 'VIDEO' ? `video-${index + 1}` : `image-${index + 1}`,
        status: 'done',
        url: getReviewMediaUrl(media.url),
        type: media.type === 'VIDEO' ? 'video/mp4' : 'image/jpeg',
        response: media,
      })),
    );
    setIsModalOpen(true);
  };

  const uploadNewFiles = async (): Promise<IReviewMedia[]> => {
    const newFiles = fileList.reduce<File[]>((acc, file) => {
      if (file.originFileObj) {
        acc.push(file.originFileObj as File);
      }

      return acc;
    }, []);

    if (newFiles.length === 0) {
      return [];
    }

    const res = await uploadReviewMediaAPI(newFiles);

    throwIfBackendError(res);

    return res.data?.fileUploaded || [];
  };

  const getKeptMedia = (): IReviewMedia[] => {
    return fileList
      .filter((file) => !file.originFileObj)
      .map((file) => {
        const responseMedia = file.response as IReviewMedia | undefined;

        return {
          url: responseMedia?.url || file.url || '',
          publicId: responseMedia?.publicId,
          type: responseMedia?.type || (file.type?.startsWith('video/') ? 'VIDEO' : 'IMAGE'),
        };
      })
      .filter((media) => Boolean(media.url));
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      message.warning('Vui lòng chọn số sao đánh giá.');
      return;
    }

    setIsSubmitting(true);

    try {
      const keptMedia = getKeptMedia();
      const uploadedMedia = await uploadNewFiles();
      const media = [...keptMedia, ...uploadedMedia];

      if (editingReview) {
        const res = await updateReviewAPI(editingReview._id, {
          rating,
          comment: comment.trim(),
          media,
        });

        throwIfBackendError(res);
        message.success('Đã cập nhật đánh giá.');
      } else {
        const res = await createReviewAPI({
          bookId: book._id,
          rating,
          comment: comment.trim(),
          media,
        });

        throwIfBackendError(res);
        message.success('Cảm ơn bạn đã đánh giá sản phẩm.');
      }

      setIsModalOpen(false);
      setEditingReview(null);
      setCurrentPage(1);
      setActiveFilter('all');
      setSelectedMediaByReview({});

      await fetchReviews(1, 'all');
      await fetchMyReviews();

      window.setTimeout(() => {
        scrollToReviewSection();
      }, 100);
    } catch (error) {
      message.error(
        normalizeAxiosMessage(
          error,
          'Bạn chỉ có thể đánh giá sách đã mua trong đơn hàng đã hoàn thành.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = (review: IReview) => {
    Modal.confirm({
      title: 'Xóa đánh giá này?',
      content: 'Đánh giá sau khi xóa sẽ không còn hiển thị trên trang sản phẩm.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await deleteReviewAPI(review._id);

          throwIfBackendError(res);

          message.success('Đã xóa đánh giá.');
          setSelectedMediaByReview({});

          await fetchReviews(currentPage, activeFilter);
          await fetchMyReviews();

          window.setTimeout(() => {
            scrollToReviewSection();
          }, 100);
        } catch (error) {
          message.error(normalizeAxiosMessage(error, 'Không thể xóa đánh giá.'));
        }
      },
    });
  };

  const handleHelpful = async (review: IReview) => {
    if (!isAuthenticated) {
      message.warning('Bạn cần đăng nhập để đánh dấu hữu ích.');
      return;
    }

    try {
      const res = await markReviewHelpfulAPI(review._id);

      throwIfBackendError(res);

      if (res.data) {
        setReviews((prev) => prev.map((item) => (item._id === review._id ? res.data! : item)));
        setMyReviews((prev) => prev.map((item) => (item._id === review._id ? res.data! : item)));
      }
    } catch (error) {
      message.error(normalizeAxiosMessage(error, 'Không thể cập nhật hữu ích.'));
    }
  };

  const isOwnerOrAdmin = (review: IReview) => {
    if (!user) {
      return false;
    }

    const reviewUser = getUserInfo(review);

    return reviewUser._id === user._id || user.role === 'ADMIN';
  };

  const isOwner = (review: IReview) => {
    if (!user || typeof review.userId === 'string') {
      return false;
    }

    return review.userId._id === user._id;
  };

  const renderMediaPreview = (review: IReview) => {
    const media = review.media || [];

    if (!media.length) {
      return null;
    }

    const selectedIndex = getSelectedMediaIndex(review._id, media.length);
    const selectedMedia = selectedIndex >= 0 ? media[selectedIndex] : null;
    const canMove = media.length > 1;

    return (
      <div className="shopee-review-media-wrap">
        <div className="shopee-review-media">
          {media.map((item, index) => {
            const mediaUrl = getReviewMediaUrl(item.url);
            const isActive = selectedIndex === index;

            return (
              <button
                type="button"
                key={`${item.url}-${index}`}
                className={`shopee-review-media-thumb ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectMedia(review._id, index)}
              >
                {item.type === 'VIDEO' ? (
                  <>
                    <video src={mediaUrl} muted className="shopee-review-thumb-video" />
                    <span className="shopee-review-video-badge">▶</span>
                  </>
                ) : (
                  <img src={mediaUrl} alt={`Ảnh đánh giá ${index + 1}`} />
                )}
              </button>
            );
          })}
        </div>

        {selectedMedia && (
          <div className="shopee-review-large-preview">
            {canMove && (
              <button
                type="button"
                className="shopee-review-large-nav shopee-review-large-nav--prev"
                onClick={() => handleMoveMedia(review._id, media.length, -1)}
                aria-label="Xem media trước"
              >
                <LeftOutlined />
              </button>
            )}

            <div className="shopee-review-preview-stage">
              {selectedMedia.type === 'VIDEO' ? (
                <video
                  key={selectedMedia.url}
                  src={getReviewMediaUrl(selectedMedia.url)}
                  controls
                  autoPlay
                  className="shopee-review-large-video"
                />
              ) : (
                <Image
                  key={selectedMedia.url}
                  src={getReviewMediaUrl(selectedMedia.url)}
                  preview
                  className="shopee-review-large-image"
                  alt="Ảnh đánh giá"
                />
              )}
            </div>

            {canMove && (
              <button
                type="button"
                className="shopee-review-large-nav shopee-review-large-nav--next"
                onClick={() => handleMoveMedia(review._id, media.length, 1)}
                aria-label="Xem media tiếp theo"
              >
                <RightOutlined />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section ref={reviewSectionRef} className="shopee-reviews-section" id="product-reviews">
      <div className="shopee-reviews-title-row">
        <h3>ĐÁNH GIÁ SẢN PHẨM</h3>

        <Button type="primary" className="shopee-review-create-btn" onClick={openCreateModal}>
          Viết đánh giá
        </Button>
      </div>

      <div className="shopee-review-overview">
        <div className="shopee-review-score">
          <div className="shopee-review-score__number">
            {normalizedSummary.averageRating.toFixed(1)}
            <span> trên 5</span>
          </div>

          <Rate
            disabled
            allowHalf
            value={normalizedSummary.averageRating}
            className="shopee-review-score__stars"
          />
        </div>

        <div className="shopee-review-filters">
          {filterItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={activeFilter === item.key ? 'active' : ''}
              onClick={() => handleFilterChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Spin
        spinning={isLoading}
        indicator={<LoadingOutlined spin />}
        wrapperClassName="shopee-review-spin"
      >
        {displayReviews.length === 0 ? (
          <Empty
            className="shopee-review-empty"
            description={
              activeFilter === 'all'
                ? 'Sản phẩm chưa có đánh giá nào.'
                : 'Chưa có đánh giá phù hợp bộ lọc.'
            }
          />
        ) : (
          <div className="shopee-review-list">
            {displayReviews.map((review) => {
              const reviewUser = getUserInfo(review);
              const orderCode = getOrderCode(review);
              const helpfulCount = review.helpfulBy?.length || 0;
              const sellerReply = getSellerReply(review);
              const isMyReview = isOwner(review);

              return (
                <article
                  className={`shopee-review-item ${isMyReview ? 'shopee-review-item--mine' : ''}`}
                  key={review._id}
                >
                  <div className="shopee-review-avatar">
                    <Avatar
                      src={getAvatarUrl(reviewUser.avatar || '')}
                      size={42}
                      icon={<UserOutlined />}
                    >
                      {reviewUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </div>

                  <div className="shopee-review-content">
                    <div className="shopee-review-top">
                      <div>
                        <h4>
                          {reviewUser.fullName || 'Người dùng BookStore'}
                          {isMyReview && (
                            <span className="shopee-my-review-badge">Đánh giá của bạn</span>
                          )}
                        </h4>

                        <Rate disabled value={review.rating} className="shopee-review-item-stars" />
                      </div>

                      {isOwnerOrAdmin(review) && (
                        <div className="shopee-review-actions">
                          {isMyReview && (
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(review)}
                            >
                              Sửa
                            </Button>
                          )}

                          <Button
                            danger
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteReview(review)}
                          >
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="shopee-review-time">
                      {dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}
                      {orderCode ? <span> | Đơn hàng: {orderCode}</span> : null}
                    </div>

                    {review.comment && <p className="shopee-review-comment">{review.comment}</p>}

                    {renderMediaPreview(review)}

                    {sellerReply && (
                      <div className="shopee-seller-reply">
                        <h5>Phản Hồi Của Người Bán</h5>
                        <p>{sellerReply}</p>
                      </div>
                    )}

                    <div className="shopee-review-footer">
                      <button
                        type="button"
                        className="shopee-review-helpful"
                        onClick={() => handleHelpful(review)}
                      >
                        <LikeOutlined />
                        <span>{helpfulCount > 0 ? helpfulCount : 'Hữu ích?'}</span>
                      </button>

                      <button type="button" className="shopee-review-more">
                        <MoreOutlined />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Spin>

      {total > PAGE_SIZE && (
        <div className="shopee-review-pagination">
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={handlePageChange}
          />
        </div>
      )}

      <Modal
        open={isModalOpen}
        title={editingReview ? 'Sửa đánh giá sản phẩm' : 'Đánh giá sản phẩm'}
        okText={editingReview ? 'Lưu thay đổi' : 'Gửi đánh giá'}
        cancelText="Hủy"
        confirmLoading={isSubmitting}
        onOk={handleSubmitReview}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingReview(null);
        }}
        destroyOnClose
      >
        <div className="shopee-review-form">
          <div className="shopee-review-form__book">
            <b>{book.mainText}</b>
            <span>Chỉ người mua có đơn hàng đã hoàn thành mới gửi được đánh giá.</span>
          </div>

          <div className="shopee-review-form__row">
            <label>Chất lượng sản phẩm</label>
            <Rate value={rating} onChange={setRating} character={<StarFilled />} />
          </div>

          <div className="shopee-review-form__row">
            <label>Nội dung đánh giá</label>
            <Input.TextArea
              value={comment}
              rows={5}
              maxLength={1500}
              showCount
              placeholder="Sách đóng gói tốt không, nội dung có hay không, giao hàng thế nào..."
              onChange={(event) => setComment(event.target.value)}
            />
          </div>

          <div className="shopee-review-form__row">
            <label>Hình ảnh / video</label>

            <Upload
              multiple
              listType="picture-card"
              accept="image/*,video/*"
              maxCount={6}
              fileList={fileList}
              beforeUpload={(file) => {
                const isImageOrVideo =
                  file.type.startsWith('image/') || file.type.startsWith('video/');

                if (!isImageOrVideo) {
                  message.warning('Chỉ upload hình ảnh hoặc video.');
                  return Upload.LIST_IGNORE;
                }

                return false;
              }}
              onChange={({ fileList: nextFileList }) => {
                const imageCount = nextFileList.filter(
                  (file) =>
                    file.type?.startsWith('image/') ||
                    (file.originFileObj &&
                      getUploadMediaType(file.originFileObj as File) === 'IMAGE'),
                ).length;

                const videoCount = nextFileList.filter(
                  (file) =>
                    file.type?.startsWith('video/') ||
                    (file.originFileObj &&
                      getUploadMediaType(file.originFileObj as File) === 'VIDEO'),
                ).length;

                if (imageCount > 5) {
                  message.warning('Tối đa 5 hình ảnh cho 1 đánh giá.');
                  return;
                }

                if (videoCount > 1) {
                  message.warning('Tối đa 1 video cho 1 đánh giá.');
                  return;
                }

                setFileList(nextFileList);
              }}
            >
              {fileList.length >= 6 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>

            <small>Tối đa 5 hình ảnh và 1 video cho mỗi đánh giá.</small>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ProductReviews;
