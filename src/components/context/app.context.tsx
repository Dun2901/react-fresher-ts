import { fetchAccountAPI, fetchMyCartAPI, fetchMyWishlistAPI } from '@/services/api.ts';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from '@/services/notification.socket';
import { createContext, useContext, useEffect, useState } from 'react';
import PacmanLoader from 'react-spinners/PacmanLoader';

interface IAppContext {
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  setUser: (v: IUser | null) => void;
  user: IUser | null;
  isAppLoading: boolean;
  setIsAppLoading: (v: boolean) => void;

  carts: ICartItem[];
  setCarts: React.Dispatch<React.SetStateAction<ICartItem[]>>;
  isCartLoading: boolean;

  wishlistItems: IBookTable[];
  setWishlistItems: React.Dispatch<React.SetStateAction<IBookTable[]>>;
  setWishlistBookIds: React.Dispatch<React.SetStateAction<string[]>>;
  wishlistBookIds: string[];
  isWishlistLoading: boolean;
}

const CurrentAppContext = createContext<IAppContext | null>(null);

type TProps = {
  children: React.ReactNode;
};

export const AppProvider = (props: TProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [carts, setCarts] = useState<ICartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true);

  const [wishlistItems, setWishlistItems] = useState<IBookTable[]>([]);
  const [wishlistBookIds, setWishlistBookIds] = useState<string[]>([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAccount = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (token) {
        window.history.replaceState({}, '', window.location.pathname);
        localStorage.setItem('access_token', token);
      }

      try {
        const res = await fetchAccountAPI();

        if (res.data) {
          setUser(res.data.user);
          setIsAuthenticated(true);
          setIsCartLoading(true);
          setIsWishlistLoading(true);

          const [cartRes, wishlistRes] = await Promise.all([
            fetchMyCartAPI(),
            fetchMyWishlistAPI(),
          ]);

          if (cartRes?.data) {
            setCarts(cartRes.data.items || []);
          }

          if (wishlistRes && (wishlistRes as any).data) {
            const listItems = (wishlistRes as any).data?.data?.bookIds || [];
            setWishlistItems(listItems);
            setWishlistBookIds(listItems.map((item: any) => item._id));
          }
        } else {
          setIsCartLoading(false);
          setIsWishlistLoading(false);
        }
      } catch (error) {
        console.error('Lỗi khi khởi tạo tài khoản và danh sách:', error);
        setIsCartLoading(false);
        setIsWishlistLoading(false);
      } finally {
        setIsAppLoading(false);
      }
    };

    fetchAccount();
  }, []);

  useEffect(() => {
    const syncCartAndWishlist = async () => {
      if (isAuthenticated) {
        setIsCartLoading(true);
        setIsWishlistLoading(true);

        try {
          const [cartRes, wishlistRes] = await Promise.all([
            fetchMyCartAPI(),
            fetchMyWishlistAPI(),
          ]);

          if (cartRes && cartRes.data) {
            setCarts(cartRes.data.items || []);
          }

          if (wishlistRes && (wishlistRes as any).data) {
            const listItems = (wishlistRes as any).data?.data?.bookIds || [];
            setWishlistItems(listItems);
            setWishlistBookIds(listItems.map((item: any) => item._id));
          }
        } catch (error) {
          console.error('Lỗi đồng bộ dữ liệu từ DB:', error);
        } finally {
          setIsCartLoading(false);
          setIsWishlistLoading(false);
        }
      } else {
        setCarts([]);
        setWishlistItems([]);
        setWishlistBookIds([]);
      }
    };

    syncCartAndWishlist();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectNotificationSocket();
      return;
    }

    connectNotificationSocket();

    return () => {
      disconnectNotificationSocket();
    };
  }, [isAuthenticated]);

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
            isCartLoading,

            wishlistItems,
            setWishlistItems,
            setWishlistBookIds,
            wishlistBookIds,
            isWishlistLoading,
          }}
        >
          {props.children}
        </CurrentAppContext.Provider>
      ) : (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
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
    throw new Error('useCurrentApp has to be used within <CurrentAppContext.Provider>');
  }

  return currentAppContext;
};
