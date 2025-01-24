import { FC } from "react";
import { useAuth } from "../contexts/AuthProvider";
import Tabs from "../components/Tabs";
import List from "../components/List";
import { ListTypeEnum } from "../types";

const Lists: FC = () => {
  const { user } = useAuth();

  if (user)
    return (
      // todo handle the bottom margin a bit better
      <div className="w-full mb-12">
        <Tabs
          tabs={[
            {
              label: "Wishlist",
              content: (
                <List
                  key={ListTypeEnum.Wishlist}
                  type={ListTypeEnum.Wishlist}
                />
              ),
            },
            {
              label: "Tradelist",
              content: (
                <List
                  key={ListTypeEnum.Tradelist}
                  type={ListTypeEnum.Tradelist}
                />
              ),
            },
          ]}
        />
      </div>
    );

  return null;
};

export default Lists;
