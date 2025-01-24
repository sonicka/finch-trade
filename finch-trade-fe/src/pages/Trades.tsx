import { FC, useEffect, useState } from "react";
import { fetchTrades } from "../api";
import { useAuth } from "../contexts/AuthProvider";
import { Trader } from "../types";
import TraderCard from "../components/TraderCard";

const Trades: FC = () => {
  const { user } = useAuth();
  const [tradeItems, setTradeItems] = useState<Trader[]>();

  useEffect(() => {
    const getTrades = async () => {
      try {
        const response = await fetchTrades(user?.id);
        setTradeItems(response);
      } catch (error) {
        console.error("Error fetching trades:", error);
      }
    };
    if (user?.id) getTrades();
  }, [user?.id]);

  return (
    <div className="w-full flex justify-center">
      {tradeItems?.map((g: Trader) => (
        <TraderCard key={g.userId} traderData={g} />
      ))}
    </div>
  );
};

export default Trades;
