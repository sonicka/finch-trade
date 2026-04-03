import { useState } from 'react';
import { ChosenItems } from '../components/layout/TraderCard';
import {
  deleteItem,
  finishGifting,
  finishTrade,
  requestTrade,
} from '../api/api';
import { useTrades, useUserItems } from '../context/UserProvider';

export const useManageTrade = () => {
  const [, getUserItems] = useUserItems();
  const { getTrades: refetchTrades } = useTrades();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTrade = async (
    action: 'request' | 'finish-trade' | 'finish-gifting',
    payload: {
      userId: number;
      tradeId?: number;
      traderId?: number;
      itemId?: number;
      colorId?: number;
      chosenItems?: ChosenItems;
    },
  ) => {
    if (!payload.userId) return;

    setLoading(true);
    setError(null);

    try {
      if (action === 'request') {
        if (!payload.traderId || !payload.chosenItems) return;
        await requestTrade(
          payload.userId,
          payload.traderId,
          payload.chosenItems,
        );
      }
      if (action === 'finish-trade') {
        if (!payload.tradeId && payload.chosenItems && payload.chosenItems.my) {
          await deleteItem(
            payload.chosenItems.my.id,
            payload.chosenItems.my.colorId,
            'tradelist',
            payload.userId,
          );
        } else {
          await finishTrade(payload.tradeId!, payload.userId);
        }
      }
      if (action === 'finish-gifting') {
        if (!!payload.itemId && !!payload.colorId && !!payload.traderId) {
          await finishGifting(
            payload.userId,
            payload.traderId,
            payload.itemId!,
            payload.colorId!,
          );
        }
      }

      await refetchTrades();
      await getUserItems();
    } catch (e: unknown) {
      setError(e instanceof Error ? e?.message : `Failed to ${action} trade`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTrade = (
    userId: number,
    traderId: number,
    chosenItems: ChosenItems,
  ) => handleTrade('request', { userId, traderId, chosenItems });

  const handleFinishTrade = (
    tradeId: number,
    userId: number,
    chosenItems?: ChosenItems,
  ) => handleTrade('finish-trade', { tradeId, userId, chosenItems });

  const handleFinishGifting = (
    userId: number,
    traderId: number,
    itemId: number,
    colorId: number,
  ) => handleTrade('finish-gifting', { userId, traderId, itemId, colorId });

  const clearError = () => setError(null);

  return {
    requestTrade: handleRequestTrade,
    finishTrade: handleFinishTrade,
    finishGifting: handleFinishGifting,
    clearError,
    error,
    loading,
  };
};
