import { JSX } from "react";
import { AuthProvider } from "./AuthProvider";
import { ColorsProvider } from "./ColorsProvider";
import { ItemsProvider } from "./ItemsProvider";

interface Props {
  children: JSX.Element;
}

export const Providers = ({ children }: Props) => {
  return (
    <AuthProvider>
      <ColorsProvider>
        <ItemsProvider>{children}</ItemsProvider>
      </ColorsProvider>
    </AuthProvider>
  );
};
