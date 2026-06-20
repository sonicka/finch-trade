import { useState } from 'react';
import {
  deleteItem,
  finishGifting,
  finishTrade,
  requestTrade,
} from '../../api/api';
import { useTrades, useUserItems } from '../context/UserProvider';
import { ChosenItem } from '../types';

export interface ChosenItems {
  my: ChosenItem | null;
  their: ChosenItem | null;
}

export const useManageTrade = () => {
  const [, getUserItems] = useUserItems();
  const { getTrades: refetchTrades } = useTrades();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTrade = async (
    action: 'request' | 'finish-trade' | 'finish-gifting',
    payload: {
      tradeId?: number;
      traderId?: number;
      itemId?: number;
      colorId?: number;
      chosenItems?: ChosenItems;
      giftedBy?: number;
      giftedTo?: number;
    },
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (action === 'request') {
        if (!payload.traderId || !payload.chosenItems) return;
        await requestTrade(payload.traderId, payload.chosenItems);
      }
      if (action === 'finish-trade') {
        if (!payload.tradeId && payload.chosenItems && payload.chosenItems.my) {
          await deleteItem(
            payload.chosenItems.my.id,
            payload.chosenItems.my.colorId,
            'tradelist',
          );
        } else {
          await finishTrade(payload.tradeId!);
        }
      }
      if (action === 'finish-gifting') {
        if (
          payload.itemId &&
          payload.colorId &&
          payload.giftedBy &&
          payload.giftedTo
        ) {
          await finishGifting(
            payload.giftedBy,
            payload.giftedTo,
            payload.itemId,
            payload.colorId,
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

  const handleRequestTrade = (traderId: number, chosenItems: ChosenItems) =>
    handleTrade('request', { traderId, chosenItems });

  const handleFinishTrade = (tradeId: number, chosenItems?: ChosenItems) =>
    handleTrade('finish-trade', { tradeId, chosenItems });

  const handleFinishGifting = (
    giftedBy: number,
    giftedTo: number,
    itemId: number,
    colorId: number,
  ) => handleTrade('finish-gifting', { giftedBy, giftedTo, itemId, colorId });

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
