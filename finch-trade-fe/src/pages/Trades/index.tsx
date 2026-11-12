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
        <div className="mx-10 mt-8">
          <InlineAlert
            type="error"
            message={catalogStatus.error}
            action={{
              label: 'Retry loading catalog',
              onClick: () => void catalogStatus.retry(),
            }}
          />
        </div>
      )}
      {catalogStatus.isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Spinner size={20} label="Loading catalog" />
          <span>Loading item catalog...</span>
        </div>
      )}
      {tradesError && (
        <div className="mx-10 mt-8">
          <InlineAlert
            type="error"
            message={tradesError}
            action={{
              label: 'Retry loading trades',
              onClick: retryTrades,
            }}
          />
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
        <div className="mx-10 mt-8">
          <InlineAlert
            type="error"
            message={pastTradesError}
            action={{
              label: 'Retry loading past trades',
              onClick: retryPastTrades,
            }}
          />
        </div>
      )}
      {pastTrades?.length > 0 ? (
        <div className="mx-10 mt-8">
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
            aria-hidden={!isPastTradesOpen}
            inert={!isPastTradesOpen}
            className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-in-out ${
              isPastTradesOpen
                ? 'grid-rows-[1fr] translate-y-0 opacity-100'
                : 'grid-rows-[0fr] -translate-y-2 opacity-0'
            }`}
          >
            <div className="min-h-0 overflow-hidden">
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
              {hasMorePastTrades ? (
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
        </div>
      ) : null}
    </div>
  );
};

export default Trades;
