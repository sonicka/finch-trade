import { FC } from "react";
import Tabs from "../components/ui/Tabs";
import List from "../components/layout/List";
import { useUser } from "../context/UserProvider";
import { ListTypeEnum } from "../types";

const Lists: FC = () => {
  const user = useUser();

  if (user)
    return (
      <div className="w-full md:w-1/2 px-6 bg-beige m-auto overflow-hidden h-full">
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
