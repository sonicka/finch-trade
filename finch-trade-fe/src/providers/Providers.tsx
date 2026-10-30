import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataProvider } from '../shared/context/DataProvider';
import { UserProvider } from '../shared/context/UserProvider';
import { AlertProvider } from '../shared/components/Alert';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: false,
    },
  },
});

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <UserProvider>
          <DataProvider>{children}</DataProvider>
        </UserProvider>
      </AlertProvider>
    </QueryClientProvider>
  );
};
