import { FC } from "react";
import { useUser } from "../context/UserProvider";
import Tabs from "../components/Tabs";
import List from "../components/List";
import { ListTypeEnum } from "../types";

const Lists: FC = () => {
  const user = useUser();

  if (user)
    return (
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
