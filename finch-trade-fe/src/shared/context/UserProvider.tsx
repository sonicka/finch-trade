import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { fetchPastTrades, fetchTrades, fetchUserItems } from '../../api/api';
import {
  ListType,
  ListTypeEnum,
  LoggedInUser,
  PastTrades,
  Trader,
  UserItem,
} from '../types';

interface Props {
  children: ReactNode;
}

interface UserState {
  user: LoggedInUser | null;
  userItems: { wishlist: UserItem[]; tradelist: UserItem[] };
  trades: Trader[];
  pastTrades: PastTrades;
  listChanged: boolean;
  loadingUser: boolean;
  errorUser: string | null;
  loadingUserItems: boolean;
  errorUserItems: string | null;
  loadingTrades: boolean;
  errorTrades: string | null;
  loadingPastTrades: boolean;
  errorPastTrades: string | null;
}

type Action =
  | { type: 'FETCH_USER_START' }
  | { type: 'FETCH_USER_SUCCESS'; payload: LoggedInUser | null }
  | { type: 'FETCH_USER_ERROR'; payload: string }
  | { type: 'FETCH_USER_ITEMS_START' }
  | {
      type: 'FETCH_USER_ITEMS_SUCCESS';
      payload: { [type: string]: UserItem[] };
    }
  | { type: 'FETCH_USER_ITEMS_ERROR'; payload: string }
  | { type: 'FETCH_TRADES_START' }
  | { type: 'FETCH_TRADES_SUCCESS'; payload: Trader[] }
  | { type: 'FETCH_TRADES_ERROR'; payload: string }
  | { type: 'FETCH_PAST_TRADES_START' }
  | { type: 'FETCH_PAST_TRADES_SUCCESS'; payload: PastTrades }
  | { type: 'FETCH_PAST_TRADES_ERROR'; payload: string }
  | { type: 'TOGGLE_LIST_CHANGE'; payload: boolean };

const initialState: UserState = {
  user: null,
  userItems: { wishlist: [], tradelist: [] },
  trades: [],
  pastTrades: [],
  listChanged: false,
  loadingUser: false,
  errorUser: null,
  loadingUserItems: false,
  errorUserItems: null,
  loadingTrades: false,
  errorTrades: null,
  loadingPastTrades: false,
  errorPastTrades: null,
};

const userReducer = (state: UserState, action: Action): UserState => {
  switch (action.type) {
    case 'FETCH_USER_START':
      return { ...state, loadingUser: true, errorUser: null };
    case 'FETCH_USER_SUCCESS':
      return { ...state, loadingUser: false, user: action.payload };
    case 'FETCH_USER_ERROR':
      return { ...state, loadingUser: false, errorUser: action.payload };
    case 'FETCH_USER_ITEMS_START':
      return { ...state, loadingUserItems: true, errorUserItems: null };
    case 'FETCH_USER_ITEMS_SUCCESS':
      return {
        ...state,
        loadingUserItems: false,
        userItems: { ...state.userItems, ...action.payload },
      };
    case 'FETCH_USER_ITEMS_ERROR':
      return {
        ...state,
        loadingUserItems: false,
        errorUserItems: action.payload,
      };
    case 'FETCH_TRADES_START':
      return { ...state, loadingTrades: true, errorTrades: null };
    case 'FETCH_TRADES_SUCCESS':
      return { ...state, loadingTrades: false, trades: action.payload };
    case 'FETCH_TRADES_ERROR':
      return { ...state, loadingTrades: false, errorTrades: action.payload };
    case 'FETCH_PAST_TRADES_START':
      return { ...state, loadingTrades: true, errorPastTrades: null };
    case 'FETCH_PAST_TRADES_SUCCESS':
      return { ...state, loadingTrades: false, pastTrades: action.payload };
    case 'FETCH_PAST_TRADES_ERROR':
      return {
        ...state,
        loadingTrades: false,
        errorPastTrades: action.payload,
      };
    case 'TOGGLE_LIST_CHANGE':
      return { ...state, listChanged: action.payload };
    default:
      return state;
  }
};

interface UserContextType extends UserState {
  getUserItems: (type?: ListType) => Promise<void>;
  getTrades: () => Promise<void>;
  getPastTrades: () => Promise<void>;
  login: (token: string) => void;
  logout: () => void;
  toggleListChange: (value: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error('useUserData must be used within a UserProvider');
  return context;
};

export const useUser = (): LoggedInUser | null => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error('useUserData must be used within a UserProvider');
  return context.user ?? null;
};

export const useUserItems = (
  type?: ListType,
): [UserItem[] | null, (type?: ListType) => Promise<void>] => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error('useUserItems must be used within a UserProvider');
  if (!type) return [null, context.getUserItems];
  return [context.userItems[type], context.getUserItems];
};

export const useTrades = (): {
  trades: Trader[];
  getTrades: () => Promise<void>;
  pastTrades: PastTrades;
  getPastTrades: () => Promise<void>;
} => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useTrades must be used within a UserProvider');
  return {
    trades: context.trades,
    getTrades: context.getTrades,
    pastTrades: context.pastTrades,
    getPastTrades: context.getPastTrades,
  };
};

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(userReducer, initialState);
  const refetchTradesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if the user is logged in when the app loads
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        dispatch({ type: 'FETCH_USER_START' });
        const decoded = jwtDecode<LoggedInUser>(token);
        dispatch({ type: 'FETCH_USER_SUCCESS', payload: decoded });
      } catch (error) {
        console.error('Token decoding failed:', error);
        dispatch({
          type: 'FETCH_USER_ERROR',
          payload: 'Failed to decode token',
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!state.user || !state.user?.id) return;

    const fetchItems = async () => {
      await getUserItems('wishlist');
      await getUserItems('tradelist');
    };

    fetchItems();
  }, [state.user?.id]);

  const startRefetchInterval = () => {
    if (refetchTradesIntervalRef.current) {
      clearTimeout(refetchTradesIntervalRef.current);
    }
    refetchTradesIntervalRef.current = setTimeout(
      () => {
        getTrades();
      },
      5 * 60 * 1000,
    ); // 5 minutes
  };

  useEffect(() => {
    if (!state.user?.id) return;
    getTrades();
    getPastTrades();
    return () => {
      if (refetchTradesIntervalRef.current) {
        clearTimeout(refetchTradesIntervalRef.current);
      }
    };
  }, [state.user?.id]);

  const getUserItems = async (type?: ListType) => {
    if (!state.user || !state.user?.id) return;
    try {
      if (type) {
        const response = await fetchUserItems(type, state.user.id);
        dispatch({
          type: 'FETCH_USER_ITEMS_SUCCESS',
          payload: { [type]: response },
        });
      } else {
        const listTypes: ListType[] = Object.values(ListTypeEnum);
        const responses = await Promise.all(
          listTypes.map((listType) => fetchUserItems(listType, state.user!.id)),
        );

        const payload = listTypes.reduce(
          (acc, listType, index) => {
            acc[listType] = responses[index];
            return acc;
          },
          {} as Record<ListType, UserItem[]>,
        );

        dispatch({
          type: 'FETCH_USER_ITEMS_SUCCESS',
          payload,
        });
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      dispatch({
        type: 'FETCH_USER_ITEMS_ERROR',
        payload: 'Failed to fetch user items',
      });
    }
  };

  const getTrades = async () => {
    if (!state.user?.id) return;
    dispatch({ type: 'FETCH_TRADES_START' });

    try {
      const response = await fetchTrades(state.user.id);
      dispatch({ type: 'FETCH_TRADES_SUCCESS', payload: response });
      startRefetchInterval();
      toggleListChange(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      dispatch({
        type: 'FETCH_TRADES_ERROR',
        payload: 'Failed to fetch trades',
      });
    }
  };

  const getPastTrades = async () => {
    if (!state.user?.id) return;
    dispatch({ type: 'FETCH_PAST_TRADES_START' });

    try {
      const response = await fetchPastTrades(state.user.id);
      dispatch({ type: 'FETCH_PAST_TRADES_SUCCESS', payload: response });
    } catch (error) {
      console.error('Error fetching past trades:', error);
      dispatch({
        type: 'FETCH_PAST_TRADES_ERROR',
        payload: 'Failed to fetch past trades',
      });
    }
  };

  const toggleListChange = (value: boolean): void => {
    dispatch({ type: 'TOGGLE_LIST_CHANGE', payload: value });
  };

  const login = (token: string) => {
    const decoded = jwtDecode<LoggedInUser>(token);
    dispatch({ type: 'FETCH_USER_SUCCESS', payload: decoded });
    localStorage.setItem('authToken', token);
  };

  const logout = () => {
    dispatch({ type: 'FETCH_USER_SUCCESS', payload: null });
    dispatch({
      type: 'FETCH_USER_ITEMS_SUCCESS',
      payload: { wishlist: [], tradelist: [] },
    });
    dispatch({ type: 'FETCH_TRADES_SUCCESS', payload: [] });
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <UserContext.Provider
      value={{
        ...state,
        login,
        logout,
        getUserItems,
        getTrades,
        getPastTrades,
        toggleListChange,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
