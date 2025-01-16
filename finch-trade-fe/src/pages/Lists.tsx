import { FC } from "react";
import Tabs from "../components/Tabs";
import WishList from "../components/WishList";
import TradeList from "../components/TradeList";
import { useAuth } from "../components/AuthProvider";

const Lists: FC = () => {
  const { user } = useAuth();
  if (user)
    return (
      <div>
        <Tabs
          tabs={[
            { label: "Wishlist", content: <WishList /> },
            { label: "Tradelist", content: <TradeList /> },
          ]}
        />
      </div>
    );

  return null;
};

export default Lists;
