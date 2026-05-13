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
  // Router type
  type BreadcrumbItem = {
    label: string;
    href?: string;
    icon?: React.ReactNode;
  };
  type HandleType = {
    breadcrumb: BreadcrumbItem | ((params: Record<string, string | undefined>) => BreadcrumbItem);
  };
}
