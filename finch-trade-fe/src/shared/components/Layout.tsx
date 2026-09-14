import { FC, ReactNode } from 'react';
import UserHeader from './UserHeader';
import BottomButton from './BottomButton';
import FeedbackButton from './FeedbackButton';

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <UserHeader />
      <div className="flex-1 overflow-auto">{children}</div>
      <FeedbackButton />
      <BottomButton />
    </div>
  );
};

export default Layout;
