import { FC, useEffect } from "react";
import { useTrades, useUser, useUserData } from "../context/UserProvider";
import { Trader } from "../types";
import TraderCard from "../components/TraderCard";

const Trades: FC = () => {
  const user = useUser();
  const [trades, refetchTrades] = useTrades();
  const { listChanged } = useUserData();

  useEffect(() => {
    if (listChanged) refetchTrades();
  }, [listChanged]);

  if (!user) return null;

  return (
    <div className="w-full flex justify-center">
      {trades?.map((g: Trader) => (
        <TraderCard
          key={g.userId}
          traderData={g}
          userId={user.id}
          refreshTrades={refetchTrades}
        />
      ))}
    </div>
  );
};

export default Trades;
