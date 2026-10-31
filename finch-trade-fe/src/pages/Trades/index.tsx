import { FC, useState } from 'react';
import PastGiftCard from './PastGiftCard';
import PastTradeCard from './PastTradeCard';
import TraderCard from './TraderCard';
import Card from '../../shared/components/Card';
import InlineAlert from '../../shared/components/InlineAlert';
import Spinner from '../../shared/components/Spinner';
import { useCatalogStatus } from '../../shared/context/DataProvider';
import { useTrades, useUser } from '../../shared/context/UserProvider';
import { PastGift, PastTrade, Trader } from '../../shared/types';

const Trades: FC = () => {
  const user = useUser();
  const {
    trades,
    tradesLoading,
    tradesError,
    retryTrades,
    pastTrades,
    pastTradesLoading,
    pastTradesError,
    retryPastTrades,
    hasMorePastTrades,
    isLoadingMorePastTrades,
    loadMorePastTrades,
  } = useTrades();
  const catalogStatus = useCatalogStatus();
  const [isPastTradesOpen, setIsPastTradesOpen] = useState(true);

  if (!user) return null;

  return (
    <div className="w-full md:w-1/2 m-auto pb-8">
      {catalogStatus.error && (
        <div className="my-2">
          <InlineAlert type="error" message={catalogStatus.error} />
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => void catalogStatus.retry()}
          >
            Retry loading catalog
          </button>
        </div>
      )}
      {catalogStatus.isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Spinner size={20} label="Loading catalog" />
          <span>Loading item catalog...</span>
        </div>
      )}
      {tradesError && (
        <div className="my-4">
          <InlineAlert type="error" message={tradesError} />
          <button
            type="button"
            className="mt-2 underline"
            onClick={retryTrades}
          >
            Retry loading trades
          </button>
        </div>
      )}
      {(tradesLoading || (pastTradesLoading && !pastTrades.length)) && (
        <div
          className="flex items-center justify-center gap-2 pt-12"
          role="status"
        >
          <Spinner size={40} label="Loading trades" />
        </div>
      )}
      {!tradesLoading &&
      !(pastTradesLoading && !pastTrades.length) &&
      !tradesError &&
      !trades.length ? (
        <p className="text-center pt-12 pb-4">
          No trades available at the moment.
        </p>
      ) : !tradesLoading ? (
        trades?.map((t: Trader) => (
          <div className="mx-10 mt-4 mb-8" key={t.userId}>
            <TraderCard key={t.userId} traderData={t} userId={user.id} />
          </div>
        ))
      ) : null}
      {pastTradesError && (
        <div className="mx-10 mt-4">
          <InlineAlert type="error" message={pastTradesError} />
          <button
            type="button"
            className="mt-2 underline"
            onClick={retryPastTrades}
          >
            Retry loading past trades
          </button>
        </div>
      )}
      {pastTrades?.length > 0 ? (
        <div className="mx-10 mt-10">
          <Card simple>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl p-5 text-left text-lg font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-darkBeige focus:ring-offset-2"
              aria-expanded={isPastTradesOpen}
              aria-controls="past-trades-list"
              onClick={() => setIsPastTradesOpen((isOpen) => !isOpen)}
            >
              <span>Past trades</span>
              <svg
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ease-in-out ${
                  isPastTradesOpen ? 'rotate-0' : '-rotate-90'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </button>
          </Card>
          <div
            id="past-trades-list"
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isPastTradesOpen
                ? 'max-h-[80vh] overflow-y-auto opacity-100 translate-y-0'
                : 'max-h-0 opacity-0 -translate-y-2'
            }`}
          >
            {pastTrades.map((p: PastGift | PastTrade) => (
              <div className="mt-4" key={p.id}>
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
            {hasMorePastTrades && isPastTradesOpen ? (
              <button
                type="button"
                className="my-4 w-full rounded-xl border-2 border-darkBeige px-4 py-2 font-semibold text-darkBeige hover:bg-beige disabled:cursor-not-allowed disabled:opacity-60"
                onClick={loadMorePastTrades}
                disabled={isLoadingMorePastTrades}
              >
                {isLoadingMorePastTrades ? 'Loading...' : 'Load more'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Trades;
