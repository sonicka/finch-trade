import { FC, ReactNode } from "react";
import UserHeader from "./UserHeader";
import BottomButton from "../ui/BottomButton";

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <UserHeader />
      <div className="flex-1 overflow-auto">{children}</div>
      <BottomButton />
    </div>
  );
};

export default Layout;
