import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cancelTrade,
  deleteItem,
  finishGifting,
  finishTrade,
  requestTrade,
} from '../../api/api';
import { useUser, userDataQueryKeys } from '../context/UserProvider';
import { ChosenItem } from '../types';

export interface ChosenItems {
  my: ChosenItem | null;
  their: ChosenItem | null;
}

export const useManageTrade = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({
      action,
      payload,
    }: {
      action: 'request' | 'finish-trade' | 'finish-gifting' | 'cancel-trade';
      payload: {
        tradeId?: number;
        traderId?: number;
        itemId?: number;
        colorId?: number;
        chosenItems?: ChosenItems;
        giftedBy?: number;
        giftedTo?: number;
      };
    }) => {
      if (action === 'request') {
        if (!payload.traderId || !payload.chosenItems) return false;
        await requestTrade(payload.traderId, payload.chosenItems);
      }
      if (action === 'finish-trade') {
        if (!payload.tradeId && payload.chosenItems?.my) {
          await deleteItem(
            payload.chosenItems.my.id,
            payload.chosenItems.my.colorId,
            'tradelist',
          );
        } else if (payload.tradeId) {
          await finishTrade(payload.tradeId);
        } else {
          return false;
        }
      }
      if (action === 'finish-gifting') {
        if (
          !payload.itemId ||
          !payload.colorId ||
          !payload.giftedBy ||
          !payload.giftedTo
        ) {
          return false;
        }
        await finishGifting(
          payload.giftedBy,
          payload.giftedTo,
          payload.itemId,
          payload.colorId,
        );
      }
      if (action === 'cancel-trade') {
        if (!payload.tradeId) return false;
        await cancelTrade(payload.tradeId);
      }
      return true;
    },
    onSuccess: async (didMutate, { action }) => {
      if (!didMutate || !user?.id) return;
      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: userDataQueryKeys.trades(user.id),
        }),
      ];
      if (action !== 'request') {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: userDataQueryKeys.items(user.id),
          }),
          queryClient.invalidateQueries({
            queryKey: userDataQueryKeys.pastTrades(user.id),
          }),
        );
      }
      await Promise.all(invalidations);
    },
  });

  const handleTrade = async (
    action: 'request' | 'finish-trade' | 'finish-gifting' | 'cancel-trade',
    payload: {
      tradeId?: number;
      traderId?: number;
      itemId?: number;
      colorId?: number;
      chosenItems?: ChosenItems;
      giftedBy?: number;
      giftedTo?: number;
    },
  ): Promise<boolean> => {
    mutation.reset();
    try {
      return await mutation.mutateAsync({ action, payload });
    } catch {
      return false;
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

  const handleCancelTrade = (tradeId: number) =>
    handleTrade('cancel-trade', { tradeId });

  const error =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? 'Failed to update trade'
        : null;

  return {
    requestTrade: handleRequestTrade,
    finishTrade: handleFinishTrade,
    finishGifting: handleFinishGifting,
    cancelTrade: handleCancelTrade,
    error,
    loading: mutation.isPending,
    pendingAction: mutation.isPending ? mutation.variables?.action : undefined,
  };
};
