import { useState } from "react";
import { deleteItem, finishTrade, requestTrade } from "../api/api";
import { useTrades, useUserItems } from "../context/UserProvider";
import { ChosenItems } from "../components/TraderCard";

export const useManageTrade = () => {
  const [_, getUserItems] = useUserItems();
  const [__, refetchTrades] = useTrades();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTrade = async (
    action: "request" | "finish",
    payload: {
      userId: number;
      tradeId?: number;
      traderId?: number;
      chosenItems?: ChosenItems;
    }
  ) => {
    if (!payload.userId) return;

    setLoading(true);
    setError(null);

    try {
      if (action === "request") {
        if (!payload.traderId || !payload.chosenItems) return;
        await requestTrade(
          payload.userId,
          payload.traderId,
          payload.chosenItems
        );
      }
      if (action === "finish") {
        if (!payload.tradeId && payload.chosenItems && payload.chosenItems.my) {
          await deleteItem(
            payload.chosenItems.my?.id,
            payload.chosenItems.my?.colorId,
            "tradelist",
            payload.userId
          );
        } else {
          await finishTrade(payload.tradeId!, payload.userId);
        }
      }

      await refetchTrades();
      await getUserItems();
    } catch (e: any) {
      setError(e?.message || `Failed to ${action} trade`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTrade = (
    userId: number,
    traderId: number,
    chosenItems: ChosenItems
  ) => handleTrade("request", { userId, traderId, chosenItems });

  const handleFinishTrade = (
    tradeId: number,
    userId: number,
    chosenItems?: ChosenItems
  ) => handleTrade("finish", { tradeId, userId, chosenItems });

  const clearError = () => setError(null);

  return {
    requestTrade: handleRequestTrade,
    finishTrade: handleFinishTrade,
    clearError,
    error,
    loading,
  };
};
