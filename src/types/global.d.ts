export {};

declare global {
  interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
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
    createdAt: Date;
    updatedAt: Date;
  }
}
