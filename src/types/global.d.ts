export {};

declare global {
  interface IBackendRes<T> {
    error: {
      timestamp: string;
      path: string;
      statusCode: number | string;
      message: string | string[];
    };
    message?: string;
    statusCode?: number | string;
    data?: T;
  }

  interface IModelPaginate<T> {
    meta: {
      current: number;
      pageSize: number;
      pages: number;
      total: number;
    };
    result: T[];
  }

  interface ILogin {
    access_token: string;
    user: IUser;
  }

  interface IRegister {
    _id: string;
    email: string;
    fullName: string;
  }

  interface IUser {
    _id: string;
    email: string;
    phone: string;
    fullName: string;
    role: string;
    avatar: string;
  }

  interface IFetchAccount {
    user: IUser;
  }

  interface IUserTable extends IUser {
    isActive: boolean;
    accountType: string;
    deleted?: boolean;
    passwordChangeAt?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface IBookTable {
    _id: string;
    thumbnail: string;
    slider: string[];
    mainText: string;
    author: string;
    price: number;
    sold: number;
    quantity: number;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  }
  // Router type
  type BreadcrumbItem = {
    label: string;
    href?: string;
    icon?: React.ReactNode;
  };
  type HandleType = {
    breadcrumb: BreadcrumbItem | ((params: Record<string, string | undefined>) => BreadcrumbItem);
  };


  interface ICartItem {
    bookId: {
      _id: string;
      mainText: string;
      thumbnail: string;
      price: number;
      quantity: number; // số lượng tồn kho của sách ở trong DB
    };
    quantity: number;   //số lượng sách mà người dùng đặt mua
    priceAtAdd: number; // giá sách tại thời điểm bấm nút Mua
  }

  interface ICart {
    _id: string;
    userId: string;
    items: ICartItem[];
    totalItems: number; // tổng số lượng tất cả các cuốn sách trong giỏ
    totalPrice: number; // tổng thành tiền của cả giỏ hàng
    createdAt: string;
    updatedAt: string;
  }
}
