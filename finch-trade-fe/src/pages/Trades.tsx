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
      {trades?.map((t: Trader) => (
        <TraderCard key={t.userId} traderData={t} userId={user.id} />
      ))}
    </div>
  );
};

export default Trades;
