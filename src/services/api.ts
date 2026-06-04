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

export const verifyAPI = (id: string, codeId: string) => {
  const urlBackend = '/auth/verify-code';
  return axios.post<IBackendRes<IUser>>(urlBackend, { id, codeId });
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

export const deleteCategoryAPI = (id: string) => {
  return axios.delete<IBackendRes<ICategory>>(`/categories/${id}`);
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
  let url = `/orders?current=${currentPage}&pageSize=${limit}`;
  if (queryStr) url += `&${queryStr}`;
  return axios.get<IBackendRes<IModelPaginate<IOrder>>>(url);
};

// 3. ddmin lấy toàn bộ đơn hàng của hệ thống
export const getAllOrdersAPI = (currentPage: number, limit: number, queryStr?: string) => {
  let url = `/orders?current=${currentPage}&pageSize=${limit}`;
  if (queryStr) url += `&${queryStr}`;
  return axios.get<IBackendRes<IModelPaginate<IOrder>>>(url);
};

// lấy chi tiết một đơn hàng theo ID cho cả ADMIN và USER
export const getOrderByIdAPI = (id: string) => {
  return axios.get<IBackendRes<IOrder>>(`/orders/${id}`);
};

// 5. admin cập nhật trạng thái đơn hàng (Duyệt, Ship, Hoàn thành, Hủy)
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
