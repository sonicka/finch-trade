import { ReactNode } from 'react';
import { DataProvider } from '../shared/context/DataProvider';
import { UserProvider } from '../shared/context/UserProvider';

interface Props {
  children: ReactNode;
}

export const Providers = ({ children }: Props) => {
  return (
    <UserProvider>
      <DataProvider>{children}</DataProvider>
    </UserProvider>
  );
};
