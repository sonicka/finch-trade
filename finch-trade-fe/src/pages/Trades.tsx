import { FC, useCallback, useEffect, useState } from "react";
import { fetchTrades } from "../api";
import { useAuth } from "../contexts/AuthProvider";
import { Trader } from "../types";
import TraderCard from "../components/TraderCard";

const Trades: FC = () => {
  const { user } = useAuth();
  const [tradeItems, setTradeItems] = useState<Trader[]>();

  const getTrades = useCallback(async () => {
    try {
      const response = await fetchTrades(user?.id);
      setTradeItems(response);
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) getTrades();
  }, [user?.id, getTrades]);

  return (
    <div className="w-full flex justify-center">
      {tradeItems?.map((g: Trader) => (
        <TraderCard
          key={g.userId}
          traderData={g}
          userId={user.id}
          refreshTrades={getTrades}
        />
      ))}
    </div>
  );
};

export default Trades;
