import axios from "services/axios.customize";

export const loginAPI = (email: string, password: string) => {
  const urlBackend = "/auth/login";
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
  const urlBackend = "/auth/register";
  return axios.post<IBackendRes<IRegister>>(urlBackend, { fullName, email, password, phone });
};

export const fetchAccountAPI = () => {
  const urlBackend = "/auth/account";
  return axios.get<IBackendRes<IFetchAccount>>(urlBackend, {
    headers: {
      delay: 1000,
    },
  });
};

export const logoutAPI = () => {
  const urlBackend = "/auth/logout";
  return axios.post<IBackendRes<IRegister>>(urlBackend);
};

export const verifyAPI = (_id: string, codeId: string) => {
  const urlBackend = "/auth/verify-code";
  return axios.post<IBackendRes<IUser>>(urlBackend, { _id, codeId });
};

export const resendCodeAPI = (email: string) => {
  const urlBackend = "/auth/resend-code";
  return axios.post<IBackendRes<IUser>>(urlBackend, { email });
};

export const forgotPasswordAPI = (email: string) => {
  const urlBackend = "/auth/forgot-password";
  return axios.post<IBackendRes<IUser>>(urlBackend, { email });
};

export const resetPasswordAPI = (
  email: string,
  codeId: string,
  newPassword: string,
  confirmPassword: string,
) => {
  const urlBackend = "/auth/reset-password";
  return axios.post<IBackendRes<IUser>>(urlBackend, {
    email,
    codeId,
    newPassword,
    confirmPassword,
  });
};

export const getUsersAPI = (query: string) => {
  const urlBackend = `/users?${query}`;
  return axios.get<IBackendRes<IModelPaginate<IUserTable>>>(urlBackend);
};
