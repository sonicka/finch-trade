import { FC, useEffect } from 'react';
import PastGiftCard from './PastGiftCard';
import PastTradeCard from './PastTradeCard';
import TraderCard from './TraderCard';
import {
  useTrades,
  useUser,
  useUserData,
} from '../../shared/context/UserProvider';
import { PastGift, PastTrade, Trader } from '../../shared/types';

const Trades: FC = () => {
  const user = useUser();
  const { trades, getTrades: refetchTrades, pastTrades } = useTrades();
  const { listChanged } = useUserData();

  useEffect(() => {
    if (listChanged) refetchTrades();
  }, [listChanged, refetchTrades]);

  if (!user) return null;

  return (
    <div className="w-full md:w-1/2 m-auto pb-8">
      {!trades.length ? (
        <p className="text-center pt-12 pb-4">
          No trades available at the moment.
        </p>
      ) : (
        trades?.map((t: Trader) => (
          <div className="mx-10 mt-4 mb-8" key={t.userId}>
            <TraderCard key={t.userId} traderData={t} userId={user.id} />
          </div>
        ))
      )}
      {pastTrades?.length > 0 ? (
        <>
          <div className="w-full flex flex-col items-center mt-10">
            <div className="w-1/2 border-t border-black mb-6 flex items-center justify-center">
              <h5 className="text-lg font-semibold bg-beige px-2 -mt-4">
                Past trades
              </h5>
            </div>
          </div>
          {pastTrades.map((p: PastGift | PastTrade) => (
            <div className="mx-10 mb-8" key={p.id}>
              {p.type === 'trade' ? (
                <PastTradeCard
                  pastTrade={p}
                  user={user}
                  traderId={p.userId1 === user.id ? p.userId2 : p.userId1}
                />
              ) : (
                <PastGiftCard pastTrade={p} traderId={p.userId} />
              )}
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
};

export default Trades;
