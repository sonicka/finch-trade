import { ReactNode } from 'react';
import { DataProvider } from '../shared/context/DataProvider';
import { UserProvider } from '../shared/context/UserProvider';
import { AlertProvider } from '../shared/components/Alert';

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  return (
    <AlertProvider>
      <UserProvider>
        <DataProvider>{children}</DataProvider>
      </UserProvider>
    </AlertProvider>
  );
};
