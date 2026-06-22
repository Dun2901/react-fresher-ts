import axios from 'services/axios.customize';

// ==================== MODULE AUTH ====================
export const loginAPI = (email: string, password: string) => {
  const urlBackend = '/auth/login';
  return axios.post<IBackendRes<ILogin>>(
    urlBackend,
    { email, password },
    {
      headers: {
        delay: 3000,
      },
    },
  );
};

export const registerAPI = (fullName: string, email: string, password: string, phone: string) => {
  const urlBackend = '/auth/register';
  return axios.post<IBackendRes<IRegister>>(urlBackend, { fullName, email, password, phone });
};

export const fetchAccountAPI = () => {
  const urlBackend = '/auth/account';
  return axios.get<IBackendRes<IFetchAccount>>(urlBackend, {
    headers: {
      delay: 1000,
    },
  });
};

export const logoutAPI = () => {
  const urlBackend = '/auth/logout';
  return axios.post<IBackendRes<IRegister>>(urlBackend);
};

export const verifyAPI = (_id: string, codeId: string) => {
  return axios.post('/auth/verify-code', { _id, codeId });
};

export const resendCodeAPI = (email: string) => {
  const urlBackend = '/auth/resend-code';
  return axios.post<IBackendRes<IUser>>(urlBackend, { email });
};

export const forgotPasswordAPI = (email: string) => {
  const urlBackend = '/auth/forgot-password';
  return axios.post<IBackendRes<IUser>>(urlBackend, { email });
};

export const resetPasswordAPI = (
  email: string,
  codeId: string,
  newPassword: string,
  confirmPassword: string,
) => {
  const urlBackend = '/auth/reset-password';
  return axios.post<IBackendRes<IUser>>(urlBackend, {
    email,
    codeId,
    newPassword,
    confirmPassword,
  });
};

export const changePasswordAPI = (oldPassword: string, newPassword: string) => {
  return axios.patch<IBackendRes<{ access_token: string }>>('/auth/change-password', {
    oldPassword,
    newPassword,
  });
};

// ==================== MODULE USER ====================
export const getUsersAPI = (query: string) => {
  const urlBackend = `/users?${query}`;
  return axios.get<IBackendRes<IModelPaginate<IUserTable>>>(urlBackend);
};

export const getUserByIdAPI = (id: string) => {
  return axios.get<IBackendRes<IUserTable>>(`/users/${id}`);
};

export const createUserAPI = (
  email: string,
  fullName: string,
  password: string,
  phone: string,
  role: string,
) => {
  return axios.post<IBackendRes<IRegister>>('/users', { fullName, email, password, phone, role });
};

export const updateUserAPI = (id: string, fullName: string, phone: string, avatar?: string) => {
  return axios.patch<IBackendRes<IRegister>>(`/users/${id}`, { fullName, phone, avatar });
};

export const deleteUserAPI = (id: string) => {
  return axios.delete<IBackendRes<IRegister>>(`/users/${id}`);
};

export const getProfileAPI = () => {
  return axios.get<IBackendRes<IUser>>('/users/profile');
};

export const updateProfileAPI = (fullName: string, phone: string, avatar?: string) => {
  return axios.patch<IBackendRes<IUser>>('/users/profile', {
    fullName,
    phone,
    avatar,
  });
};

// ==================== MODULE BOOK ====================
export const getBooksAPI = (query: string) => {
  const urlBackend = `/books?${query}`;
  return axios.get<IBackendRes<IModelPaginate<IBookTable>>>(urlBackend);
};

export const getBookByIdAPI = (id: string) => {
  return axios.get<IBackendRes<IBookTable>>(`/books/${id}`);
};

export const createBookAPI = (data: {
  mainText: string;
  author: string;
  price: number;
  quantity: number;
  category: string;
  thumbnail: string;
  slider: string[];
}) => {
  return axios.post<IBackendRes<IBookTable>>('/books', data);
};

export const updateBookAPI = (
  id: string,
  data: {
    mainText: string;
    author: string;
    price: number;
    quantity: number;
    category: string;
    thumbnail: string;
    slider: string[];
  },
) => {
  return axios.patch<IBackendRes<IBookTable>>(`/books/${id}`, data);
};

export const deleteBookAPI = (id: string) => {
  return axios.delete<IBackendRes<IBookTable>>(`/books/${id}`);
};

// ==================== MODULE CATEGORY ====================

export const getCategoriesAPI = (query: string) => {
  return axios.get<IBackendRes<IModelPaginate<ICategory>>>(`/categories?${query}`);
};

export const getCategoryByIdAPI = (id: string) => {
  return axios.get<IBackendRes<ICategory>>(`/categories/${id}`);
};

export const createCategoryAPI = (data: { name: string; description?: string }) => {
  return axios.post<IBackendRes<ICategory>>('/categories', data);
};

export const updateCategoryAPI = (
  id: string,
  data: {
    name?: string;
    description?: string;
  },
) => {
  return axios.patch<IBackendRes<ICategory>>(`/categories/${id}`, data);
};

/**
 * Soft delete category.
 */
export const deleteCategoryAPI = (id: string) => {
  return axios.delete<IBackendRes<{ message: string }>>(`/categories/${id}`);
};

/**
 * Lấy danh sách category đã bị soft delete.
 */
export const getDeletedCategoriesAPI = () => {
  return axios.get<IBackendRes<ICategory[]>>('/categories/deleted');
};

/**
 * Khôi phục category đã bị soft delete.
 */
export const restoreCategoryAPI = (id: string) => {
  return axios.patch<IBackendRes<{ message: string }>>(`/categories/${id}/restore`);
};

// ==================== MODULE UPLOAD FILE ====================
export const uploadAvatarAPI = (formData: FormData) => {
  return axios.post<IBackendRes<{ fileUploaded: string }>>('/files/upload', formData, {
    headers: {
      folder_type: 'avatar',
    },
  });
};

export const uploadMultipleFileAPI = (files: File[]) => {
  const bodyFormData = new FormData();

  files.forEach((file) => {
    bodyFormData.append('files', file);
  });

  return axios.post<IBackendRes<{ fileUploaded: string[] }>>(
    '/files/upload-multiple',
    bodyFormData,
    {
      headers: {
        folder_type: 'book',
      },
    },
  );
};

export const deleteUploadedFileAPI = (fileName: string) => {
  return axios.delete<IBackendRes<{ deleted: boolean; fileName: string }>>(
    `/files/${encodeURIComponent(fileName)}`,
    {
      headers: {
        folder_type: 'book',
      },
    },
  );
};

// ----------------------------------MODULE CART-----------------------------------
// 1. lấy giỏ hàng cuả user đăng nhập
export const fetchMyCartAPI = () => {
  return axios.get<IBackendRes<ICart>>('/carts/me');
};
// 2. Thêm/cộng dồn số lượng item
export const addItemToCartAPI = (bookId: string, quantity: number) => {
  return axios.post<IBackendRes<ICart>>('/carts/items', { bookId, quantity });
};
//3. cập nhaatj só lượng
export const updateCartItemAPI = (bookId: string, quantity: number) => {
  return axios.patch<IBackendRes<ICart>>(`/carts/items/${bookId}`, { quantity });
};
//4. Xóa 1 sản phẩm
export const removeCartItemAPI = (bookId: string) => {
  return axios.delete<IBackendRes<ICart>>(`/carts/items/${bookId}`);
};
//5. Xóa hết giỏ hàng nếu đặt hàng thành công
export const clearCartAPI = () => {
  return axios.delete<IBackendRes<ICart>>('/carts/clear');
};

//---------------------------------MODULE ORDER-------------------
// 1. khách hàng bấm nút đặt hàng (Checkout)
export const checkoutAPI = (data: ICheckoutDto) => {
  return axios.post<IBackendRes<IOrder>>('/orders/checkout', data);
};

// 2. khách hàng lấy danh sách đơn hàng của mình
export const getMyOrdersAPI = (currentPage: number, limit: number, queryStr?: string) => {
  let url = `/orders/my?current=${currentPage}&pageSize=${limit}`;
  if (queryStr) url += `&${queryStr}`;
  return axios.get<IBackendRes<IModelPaginate<IOrder>>>(url);
};

// 3. admin lấy toàn bộ đơn hàng của hệ thống
export const getAllOrdersAPI = (currentPage: number, limit: number, queryStr?: string) => {
  let url = `/orders?current=${currentPage}&pageSize=${limit}`;
  if (queryStr) url += `&${queryStr}`;
  return axios.get<IBackendRes<IModelPaginate<IOrder>>>(url);
};

// Admin xem chi tiết đơn hàng
export const getOrderByIdAPI = (id: string) => {
  return axios.get<IBackendRes<IOrder>>(`/orders/${id}`);
};

// User xem chi tiết đơn hàng của mình
export const getMyOrderByIdAPI = (id: string) => {
  return axios.get<IBackendRes<IOrder>>(`/history/${id}`);
};

// 5. admin cập nhật trạng thái đơn hàng
export const updateOrderStatusAPI = (
  id: string,
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED',
) => {
  return axios.patch<IBackendRes<IOrder>>(`/orders/${id}/status`, { status });
};

// 6. khách hàng tự yêu cầu hủy đơn hàng khi đơn đang ở trạng thái PENDING
export const cancelOrderAPI = (id: string) => {
  return axios.patch<IBackendRes<IOrder>>(`/orders/${id}/cancel`);
};

// 7. tạo URL thanh toán VNPay
export const createVnpayPaymentUrlAPI = (orderId: string) => {
  return axios.post<IBackendRes<{ paymentUrl: string; orderCode: string }>>(
    `/payments/vnpay/create-payment-url/${orderId}`,
  );
};

// 8. verify kết quả thanh toán VNPay
export const verifyVnpayReturnAPI = (queryString: string) => {
  return axios.get<IBackendRes<{ success: boolean; message: string; orderCode?: string }>>(
    `/payments/vnpay-return?${queryString}`,
  );
};

//---------------------------------MODULE HISTORY-------------------
export const getMyHistoryOrdersAPI = (currentPage: number, limit: number, queryStr?: string) => {
  let url = `/history?current=${currentPage}&pageSize=${limit}`;

  if (queryStr) url += `&${queryStr}`;

  return axios.get<IBackendRes<IModelPaginate<IOrder>>>(url);
};

export const getHistoryOrderByIdAPI = (id: string) => {
  return axios.get<IBackendRes<IOrder>>(`/history/${id}`);
};

//---------------------------------MODULE DASHBOARD-------------------

export const getDashboardSummaryAPI = () => {
  return axios.get<IBackendRes<IDashboardSummary>>('/dashboard/summary');
};

export const getLatestOrdersDashboardAPI = (limit = 5) => {
  return axios.get<IBackendRes<IDashboardLatestOrder[]>>(`/dashboard/latest-orders?limit=${limit}`);
};

export const getTopSellingBooksDashboardAPI = (limit = 5) => {
  return axios.get<IBackendRes<IDashboardTopSellingBook[]>>(
    `/dashboard/top-selling-books?limit=${limit}`,
  );
};

export const getRevenueChartDashboardAPI = (type: 'day' | 'month' = 'month') => {
  return axios.get<IBackendRes<IDashboardRevenueChartItem[]>>(
    `/dashboard/revenue-chart?type=${type}`,
  );
};

//---------------------------------MODULE REVIEW / RATING-------------------
export const uploadReviewMediaAPI = (files: File[]) => {
  const bodyFormData = new FormData();

  files.forEach((file) => {
    bodyFormData.append('files', file);
  });

  return axios.post<
    IBackendRes<{
      fileUploaded: IReviewMedia[];
      fileInfo: unknown[];
    }>
  >('/files/upload-review', bodyFormData, {
    headers: {
      folder_type: 'review',
    },
  });
};

export const getMyReviewsByBookAPI = (bookId: string) => {
  return axios.get<IBackendRes<IReview[]>>(`/reviews/book/${bookId}/me`);
};

export const getReviewsByBookAPI = (bookId: string, query = 'current=1&pageSize=5') => {
  return axios.get<IBackendRes<IReviewListData>>(`/reviews/book/${bookId}?${query}`);
};

export const createReviewAPI = (data: ICreateReviewDto) => {
  return axios.post<IBackendRes<IReview>>('/reviews', data);
};

export const updateReviewAPI = (id: string, data: IUpdateReviewDto) => {
  return axios.patch<IBackendRes<IReview>>(`/reviews/${id}`, data);
};

export const deleteReviewAPI = (id: string) => {
  return axios.delete<IBackendRes<{ deleted: boolean; _id: string }>>(`/reviews/${id}`);
};

export const markReviewHelpfulAPI = (id: string) => {
  return axios.patch<IBackendRes<IReview>>(`/reviews/${id}/helpful`);
};

export const getMyPendingReviewsAPI = () => {
  return axios.get<IBackendRes<IReviewPendingItem[]>>('/reviews/my-pending');
};

// ==================== MODULE LOCATION ====================
export const getProvincesAPI = () => {
  return axios.get<
    IBackendRes<
      {
        provinceCode: string;
        name: string;
        shortName: string;
        code: string;
        placeType: string;
      }[]
    >
  >('/locations/provinces');
};

export const getWardsByProvinceAPI = (provinceCode: string) => {
  return axios.get<
    IBackendRes<
      {
        wardCode: string;
        name: string;
        provinceCode: string;
      }[]
    >
  >(`/locations/provinces/${provinceCode}/wards`);
};

// ==================== MODULE NOTIFICATION ====================
export const getMyNotificationsAPI = (currentPage: number, limit: number, isRead?: boolean) => {
  let url = `/notifications/my?current=${currentPage}&pageSize=${limit}`;

  if (typeof isRead === 'boolean') {
    url += `&isRead=${isRead}`;
  }

  return axios.get<IBackendRes<IModelPaginate<IUserNotification>>>(url);
};

export const getUnreadNotificationCountAPI = () => {
  return axios.get<IBackendRes<{ total: number }>>('/notifications/unread-count');
};

export const markNotificationReadAPI = (id: string) => {
  return axios.patch<IBackendRes<IUserNotification>>(`/notifications/${id}/read`);
};

export const markAllNotificationsReadAPI = () => {
  return axios.patch<IBackendRes<{ success: boolean }>>('/notifications/read-all');
};
