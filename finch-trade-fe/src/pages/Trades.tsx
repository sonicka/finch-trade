import { FC, useEffect } from "react";
import { useTrades, useUser, useUserData } from "../context/UserProvider";
import { PastGift, PastTrade, Trader } from "../types";
import TraderCard from "../components/TraderCard";
import PastTradeCard from "../components/PastTradeCard";
import Alert from "../components/Alert";
import PastGiftCard from "../components/PastGiftCard";

const Trades: FC = () => {
  const user = useUser();
  const { trades, getTrades: refetchTrades, pastTrades } = useTrades();
  const { listChanged } = useUserData();

  useEffect(() => {
    if (listChanged) refetchTrades();
  }, [listChanged]);

  if (!user) return null;

  return (
    <div className="w-full flex flex-col items-center pb-12">
      {!trades.length ? (
        <div className="py-8">
          <Alert type="info" message="No trades available at the moment." />
        </div>
      ) : (
        trades?.map((t: Trader) => (
          <TraderCard key={t.userId} traderData={t} userId={user.id} />
        ))
      )}
      {pastTrades?.length > 0 ? (
        <>
          <div className="w-full flex flex-col items-center relative">
            <div className="w-1/2 border-t border-black my-6 relative">
              <h5 className="text-lg font-semibold bg-white px-2 absolute left-1/2 -translate-x-1/2 -top-4">
                Past trades
              </h5>
            </div>
          </div>
          {pastTrades?.map((p: PastGift | PastTrade) =>
            p.type === "gift" ? (
              <PastGiftCard key={p.id} pastTrade={p} traderId={p.userId} />
            ) : (
              <PastTradeCard
                key={p.id}
                pastTrade={p}
                user={user}
                traderId={p.userId1 === user.id ? p.userId2 : p.userId1}
              />
            )
          )}
        </>
      ) : null}
    </div>
  );
};

export default Trades;
