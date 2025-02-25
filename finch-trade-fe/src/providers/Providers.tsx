import { ReactNode } from "react";
import { DataProvider } from "../context/DataProvider";
import { UserProvider } from "../context/UserProvider";

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
