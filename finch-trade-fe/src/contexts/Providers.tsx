import { JSX } from "react";
import { AuthProvider } from "./AuthProvider";
import { ColorsProvider } from "./ColorsProvider";

interface Props {
  children: JSX.Element;
}

export const Providers = ({ children }: Props) => {
  return (
    <AuthProvider>
      <ColorsProvider>{children}</ColorsProvider>
    </AuthProvider>
  );
};
