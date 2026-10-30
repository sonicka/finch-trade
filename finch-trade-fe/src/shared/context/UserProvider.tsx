import {
  createContext,
  ReactNode,
  useContext,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { fetchPastTrades, fetchTrades, fetchUserItems } from '../../api/api';
import { ListType, LoggedInUser } from '../types';

interface Props {
  children: ReactNode;
}

export const userDataQueryKeys = {
  authUser: ['auth', 'user'] as const,
  all: ['userData'] as const,
  user: (userId: number) => ['userData', userId] as const,
  items: (userId: number) => ['userData', userId, 'items'] as const,
  userItems: (userId: number, type: ListType) =>
    ['userData', userId, 'items', type] as const,
  trades: (userId: number) => ['userData', userId, 'trades'] as const,
  pastTrades: (userId: number) => ['userData', userId, 'pastTrades'] as const,
};

interface UserContextType {
  user: LoggedInUser | null;
  login: (token: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const decodeUserToken = (token: string): LoggedInUser => {
  const decoded = jwtDecode<LoggedInUser>(token);
  if (!decoded.id || !decoded.email || !decoded.username) {
    throw new Error('Invalid token payload: missing required fields');
  }
  return decoded;
};

const readStoredUser = (): LoggedInUser | null => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    return decodeUserToken(token);
  } catch {
    console.error('Token validation failed');
    localStorage.removeItem('authToken');
    return null;
  }
};

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

export const useUserItems = (type: ListType) => {
  const user = useUser();
  return useQuery({
    queryKey: user
      ? userDataQueryKeys.userItems(user.id, type)
      : [...userDataQueryKeys.all, 'anonymous', type],
    queryFn: () => fetchUserItems(type),
    enabled: Boolean(user?.id),
  });
};

export const useTrades = () => {
  const user = useUser();
  const tradesQuery = useQuery({
    queryKey: user
      ? userDataQueryKeys.trades(user.id)
      : [...userDataQueryKeys.all, 'anonymous', 'trades'],
    queryFn: fetchTrades,
    enabled: Boolean(user?.id),
    refetchInterval: 5 * 60 * 1000,
  });
  const pastTradesQuery = useQuery({
    queryKey: user
      ? userDataQueryKeys.pastTrades(user.id)
      : [...userDataQueryKeys.all, 'anonymous', 'pastTrades'],
    queryFn: fetchPastTrades,
    enabled: Boolean(user?.id),
  });

  return {
    trades: tradesQuery.data ?? [],
    pastTrades: pastTradesQuery.data ?? [],
  };
};

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user = null } = useQuery({
    queryKey: userDataQueryKeys.authUser,
    queryFn: readStoredUser,
    initialData: readStoredUser,
    staleTime: Infinity,
  });

  const login = (token: string) => {
    const decoded = decodeUserToken(token);
    localStorage.setItem('authToken', token);
    queryClient.setQueryData(userDataQueryKeys.authUser, decoded);
  };

  const logout = () => {
    queryClient.removeQueries({ queryKey: userDataQueryKeys.all });
    localStorage.removeItem('authToken');
    queryClient.setQueryData(userDataQueryKeys.authUser, null);
    navigate('/login');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
