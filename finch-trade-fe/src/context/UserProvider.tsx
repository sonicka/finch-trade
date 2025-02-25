import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { jwtDecode } from "jwt-decode";
import { ListType, LoggedInUser, Trader, UserItem } from "../types";
import { fetchTrades, fetchUserItems } from "../api/api";

interface Props {
  children: ReactNode;
}

interface UserState {
  user: LoggedInUser | null;
  userItems: { wishlist: UserItem[]; tradelist: UserItem[] };
  trades: Trader[];
  loadingUser: boolean;
  errorUser: string | null;
  loadingUserItems: boolean;
  errorUserItems: string | null;
  loadingTrades: boolean;
  errorTrades: string | null;
}

type Action =
  | { type: "FETCH_USER_START" }
  | { type: "FETCH_USER_SUCCESS"; payload: LoggedInUser | null }
  | { type: "FETCH_USER_ERROR"; payload: string }
  | { type: "FETCH_USER_ITEMS_START" }
  | {
      type: "FETCH_USER_ITEMS_SUCCESS";
      payload: { [type: string]: UserItem[] };
    }
  | { type: "FETCH_USER_ITEMS_ERROR"; payload: string }
  | { type: "FETCH_TRADES_START" }
  | { type: "FETCH_TRADES_SUCCESS"; payload: Trader[] }
  | { type: "FETCH_TRADES_ERROR"; payload: string };

const initialState: UserState = {
  user: null,
  userItems: { wishlist: [], tradelist: [] },
  trades: [],
  loadingUser: false,
  errorUser: null,
  loadingUserItems: false,
  errorUserItems: null,
  loadingTrades: false,
  errorTrades: null,
};

const userReducer = (state: UserState, action: Action): UserState => {
  switch (action.type) {
    case "FETCH_USER_START":
      return { ...state, loadingUser: true, errorUser: null };
    case "FETCH_USER_SUCCESS":
      return { ...state, loadingUser: false, user: action.payload };
    case "FETCH_USER_ERROR":
      return { ...state, loadingUser: false, errorUser: action.payload };
    case "FETCH_USER_ITEMS_START":
      return { ...state, loadingUserItems: true, errorUserItems: null };
    case "FETCH_USER_ITEMS_SUCCESS":
      return {
        ...state,
        loadingUserItems: false,
        userItems: { ...state.userItems, ...action.payload },
      };
    case "FETCH_USER_ITEMS_ERROR":
      return {
        ...state,
        loadingUserItems: false,
        errorUserItems: action.payload,
      };
    case "FETCH_TRADES_START":
      return { ...state, loadingTrades: true, errorTrades: null };
    case "FETCH_TRADES_SUCCESS":
      return { ...state, loadingTrades: false, trades: action.payload };
    case "FETCH_TRADES_ERROR":
      return { ...state, loadingTrades: false, errorTrades: action.payload };
    default:
      return state;
  }
};

interface UserContextType extends UserState {
  getUserItems: (type: ListType) => Promise<void>;
  getTrades: () => void;
  login: (token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserData must be used within a UserProvider");
  return context;
};

export const useUser = (): LoggedInUser | null => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserData must be used within a UserProvider");
  return context.user ?? null;
};

export const useUserItems = (
  type: ListType
): [UserItem[], (type: ListType) => Promise<void>] => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserItems must be used within a UserProvider");
  return [context.userItems[type], context.getUserItems];
};

export const UserProvider = ({ children }: Props) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Check if the user is logged in when the app loads
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        dispatch({ type: "FETCH_USER_START" });
        const decoded = jwtDecode<LoggedInUser>(token);
        dispatch({ type: "FETCH_USER_SUCCESS", payload: decoded });
      } catch (error) {
        console.error("Token decoding failed:", error);
        dispatch({
          type: "FETCH_USER_ERROR",
          payload: "Failed to decode token",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!state.user?.id) return;

    const fetchItems = async () => {
      await getUserItems("wishlist");
      await getUserItems("tradelist");
    };

    fetchItems();
  }, [state.user?.id]);

  useEffect(() => {
    if (!state.user?.id) return;

    const interval = setInterval(() => {
      getTrades();
    }, 300000); // Runs every 5 minutes

    return () => clearInterval(interval);
  }, [state.user?.id]);

  const getUserItems = async (type: ListType) => {
    if (!state.user?.id) return;
    try {
      const response = await fetchUserItems(type, state.user.id);
      dispatch({
        type: "FETCH_USER_ITEMS_SUCCESS",
        payload: { [type]: response },
      });
    } catch (error) {
      console.error("Error fetching items:", error);
      dispatch({
        type: "FETCH_USER_ITEMS_ERROR",
        payload: "Failed to fetch user items",
      });
    }
  };

  const getTrades = async () => {
    if (!state.user?.id) return;
    dispatch({ type: "FETCH_TRADES_START" });

    try {
      const response = await fetchTrades(state.user.id);
      dispatch({ type: "FETCH_TRADES_SUCCESS", payload: response });
    } catch (error) {
      console.error("Error fetching trades:", error);
      dispatch({
        type: "FETCH_TRADES_ERROR",
        payload: "Failed to fetch trades",
      });
    }
  };

  const login = (token: string) => {
    const decoded = jwtDecode<LoggedInUser>(token);
    dispatch({ type: "FETCH_USER_SUCCESS", payload: decoded });
    localStorage.setItem("authToken", token);
  };

  const logout = () => {
    dispatch({ type: "FETCH_USER_SUCCESS", payload: null });
    dispatch({
      type: "FETCH_USER_ITEMS_SUCCESS",
      payload: { wishlist: [], tradelist: [] },
    });
    dispatch({ type: "FETCH_TRADES_SUCCESS", payload: [] });
    localStorage.removeItem("authToken");
    location.href = "/login";
  };

  return (
    <UserContext.Provider
      value={{
        ...state,
        login,
        logout,
        getUserItems,
        getTrades,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
