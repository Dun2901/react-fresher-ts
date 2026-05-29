import { fetchAccountAPI, fetchMyCartAPI } from "@/services/api.ts";
import { createContext, useContext, useEffect, useState } from "react";
import PacmanLoader from "react-spinners/PacmanLoader";

interface IAppContext {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  setUser: (v: IUser | null) => void;
  user: IUser | null;
  isAppLoading: boolean;
  setIsAppLoading: (v: boolean) => void;

  carts: ICartItem[];
  setCarts: React.Dispatch<React.SetStateAction<ICartItem[]>>;
}


const CurrentAppContext = createContext<IAppContext | null>(null);

type TProps = {
  children: React.ReactNode;
};

export const AppProvider = (props: TProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [carts, setCarts] = useState<ICartItem[]>([]); // state lưu trữ danh sách giỏ hàng


  useEffect(() => {
    const fetchAccount = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");
      if (token) {
        window.history.replaceState({}, "", window.location.pathname);
        localStorage.setItem("access_token", token);
      }

      const res = await fetchAccountAPI();
      if (res.data) {
        setUser(res.data.user);
        setIsAuthenticated(true);
      }
      setIsAppLoading(false);
    };

    fetchAccount();
  }, []);

  //đòng bộ giỏ hàng từ DB lên context
  useEffect(() => {
    const syncCart = async () => {
      if (isAuthenticated) {
        try {
          const res = await fetchMyCartAPI();
          if (res && res.data) {
            // thêm mảng items từ MongoDB vào state toàn cục
            setCarts(res.data.items || []);
          }
        } catch (error) {
          console.error("Lỗi đồng bộ giỏ hàng từ DB:", error);
        }
      } else {
        // nếu logout hoặc chưa login thì trả về giỏ rỗng
        setCarts([]);
      }
    };

    syncCart();
  }, [isAuthenticated]); // khởi chạy lại mỗi khi trạng thái đăng nhập thay đổi

  return (
    <>
      {isAppLoading === false ? (
        <CurrentAppContext.Provider
          value={{
            isAuthenticated,
            user,
            setIsAuthenticated,
            setUser,
            isAppLoading,
            setIsAppLoading,

            carts,
            setCarts,
          }}
        >
          {props.children}
        </CurrentAppContext.Provider>
      ) : (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <PacmanLoader size={30} color="#36d6b4" />
        </div>
      )}
    </>
  );
};

export const useCurrentApp = () => {
  const currentAppContext = useContext(CurrentAppContext);

  if (!currentAppContext) {
    throw new Error("useCurrentApp has to be used within <CurrentAppContext.Provider>");
  }

  return currentAppContext;
};
