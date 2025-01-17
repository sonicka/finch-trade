import { FC, useEffect, useState } from "react";
import Tabs from "../components/Tabs";
import WishList from "../components/WishList";
import TradeList from "../components/TradeList";
import { useAuth } from "../components/AuthProvider";
import { getColors } from "../api";
import { Color } from "../types";

const Lists: FC = () => {
  const { user } = useAuth();
  const [colors, setColors] = useState<Color[]>([]);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await getColors();
        setColors(response);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    fetchColors();
  }, []);

  if (user)
    return (
      <div>
        <Tabs
          tabs={[
            { label: "Wishlist", content: <WishList colors={colors} /> },
            { label: "Tradelist", content: <TradeList colors={colors} /> },
          ]}
        />
      </div>
    );

  return null;
};

export default Lists;
