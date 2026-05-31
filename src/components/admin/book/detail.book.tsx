import { getBookByIdAPI } from '@/services/api';
import { Descriptions, Empty, Image, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import './detail.book.scss';

const { Title } = Typography;

const DetailBook = () => {
  const { id } = useParams();
  const [book, setBook] = useState<IBookTable | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeImage, setActiveImage] = useState<string>('');

  const buildImageUrl = (image?: string) => {
    if (!image) return '';

    if (image.startsWith('http')) {
      return image;
    }

    return `${import.meta.env.VITE_BACKEND_URL}/images/book/${image}`;
  };

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      setLoading(true);

      const res = await getBookByIdAPI(id);

      if (res.data) {
        setBook(res.data);

        const firstImage =
          buildImageUrl(res.data.thumbnail) || buildImageUrl(res.data.slider?.[0]) || '';

        setActiveImage(firstImage);
      }

      setLoading(false);
    };

    fetchBook();
  }, [id]);

  const images = useMemo(() => {
    if (!book) return [];

    const imageList = [book.thumbnail, ...(book.slider || [])]
      .filter(Boolean)
      .map((item) => buildImageUrl(item));

    return Array.from(new Set(imageList));
  }, [book]);

  if (loading) {
    return (
      <div className="detail-book-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!book) {
    return <Empty description="Không tìm thấy thông tin sách" />;
  }

  return (
    <div className="detail-book-page">
      <Title level={3} className="detail-book-title">
        Chi tiết sách
      </Title>

      <div className="detail-book-wrapper">
        <div className="detail-book-gallery">
          <div className="detail-book-main-image">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={book.mainText}
                className="book-image"
                fallback="/default-book.png"
              />
            ) : (
              <Empty description="Chưa có ảnh sách" />
            )}
          </div>

          {images.length > 0 && (
            <div className="detail-book-thumbnails">
              {images.map((image) => (
                <div
                  key={image}
                  className={`detail-book-thumbnail ${activeImage === image ? 'active' : ''}`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={book.mainText} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-book-info">
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="ID">{book._id}</Descriptions.Item>

            <Descriptions.Item label="Tên sách">
              <strong>{book.mainText}</strong>
            </Descriptions.Item>

            <Descriptions.Item label="Tác giả">{book.author}</Descriptions.Item>

            <Descriptions.Item label="Thể loại">
              <Tag color="blue">
                {typeof book.category === 'object' ? book.category?.name : book.category}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Giá">
              <span className="detail-book-price">{book.price?.toLocaleString('vi-VN')} đ</span>
            </Descriptions.Item>

            <Descriptions.Item label="Số lượng">{book.quantity}</Descriptions.Item>

            <Descriptions.Item label="Đã bán">{book.sold}</Descriptions.Item>

            <Descriptions.Item label="Created At">
              {book.createdAt ? dayjs(book.createdAt).format('DD/MM/YYYY HH:mm:ss') : ''}
            </Descriptions.Item>

            <Descriptions.Item label="Updated At">
              {book.updatedAt ? dayjs(book.updatedAt).format('DD/MM/YYYY HH:mm:ss') : ''}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </div>
  );
};

export default DetailBook;
