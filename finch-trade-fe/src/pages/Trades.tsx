import { FC, useCallback, useEffect, useState } from "react";
import { fetchTrades } from "../api/api";
import { useUser } from "../context/UserProvider";
import { Trader } from "../types";
import TraderCard from "../components/TraderCard";

const Trades: FC = () => {
  const user = useUser();
  const [tradeItems, setTradeItems] = useState<Trader[]>();

  const getTrades = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchTrades(user.id);
      setTradeItems(response);
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    getTrades();
  }, [user?.id, getTrades]);

  if (!user) return null;

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
