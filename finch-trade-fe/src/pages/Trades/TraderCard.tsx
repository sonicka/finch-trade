import { FC, useEffect, useState } from 'react';
import TraderTradingSection from './TraderTradingSection';
import TraderGiftingSection from './TraderGiftingSection';
import TradeButtons from './TradeButtons';
import TradeAlert from './TradeAlert';
import { usePendingGift } from '../../shared/context/PendingGiftProvider';
import InlineAlert from '../../shared/components/InlineAlert';
import Card from '../../shared/components/Card';
import { useManageTrade, ChosenItems } from '../../shared/hooks/trades';
import { useUserById } from '../../shared/hooks/users';
import { Trader } from '../../shared/types';

interface Props {
  traderData: Trader;
  userId: number;
}

const TraderCard: FC<Props> = ({ traderData, userId }) => {
  const trader = useUserById(traderData.userId);
  const { chosenItems: tradeChosenItems, setChosenItems: setTradeChosenItems } =
    useChosenItems(traderData);
  const { pendingGift, updatePendingGift, clearPendingGift } = usePendingGift(
    userId,
    traderData.userId,
  );
  const gifting = traderData.has.length === 0;
  const chosenItems = gifting
    ? { my: pendingGift.item, their: null }
    : tradeChosenItems;
  const setChosenItems = (items: ChosenItems) => {
    if (gifting) updatePendingGift({ item: items.my });
    else setTradeChosenItems(items);
  };
  const {
    requestTrade,
    finishTrade,
    finishGifting,
    cancelTrade,
    error,
    loading,
    pendingAction,
  } = useManageTrade();
  const loadingButtonId =
    pendingAction === 'request'
      ? 'trade-request'
      : pendingAction === 'cancel-trade'
        ? 'cancel-trade'
        : pendingAction === 'finish-trade' || pendingAction === 'finish-gifting'
          ? 'finish-trade'
          : undefined;
  const friendCodeShown = pendingGift.friendCodeShown;
  const { requestedByMe, requestedByThem, tradeAccepted, showAlert } =
    getTradeStatus(traderData, friendCodeShown);

  useEffect(() => {
    if (!gifting && (pendingGift.item || pendingGift.friendCodeShown)) {
      clearPendingGift();
    }
  }, [gifting, pendingGift, clearPendingGift]);

  const handleShowFriendCode = () =>
    updatePendingGift({ friendCodeShown: true });

  const handleRequestTrade = () => requestTrade(traderData.userId, chosenItems);

  const handleFinishTrade = async () => {
    let didFinish: boolean;
    if (gifting && chosenItems.my?.id)
      didFinish = await finishGifting(
        userId,
        traderData.userId,
        chosenItems.my?.id,
        chosenItems.my?.colorId,
      );
    else didFinish = await finishTrade(traderData.tradeId, chosenItems);
    if (!didFinish) return;
    if (gifting) clearPendingGift();
    else setTradeChosenItems({ my: null, their: null });
  };

  if (!trader) return null;

  return (
    <Card simple>
      <div className="flex flex-col gap-6 items-center justify-center py-8 px-8">
        <h2 className="text-xl text-center font-semibold">
          You have matched with
          <br />
          <b>{`${trader?.birbName} & ${trader?.username}!`}</b>
        </h2>
        {gifting && (
          <TraderGiftingSection
            trader={trader}
            traderData={traderData}
            chosenItems={chosenItems}
            setChosenItems={setChosenItems}
          />
        )}
        {!gifting && (
          <TraderTradingSection
            trader={trader}
            traderData={traderData}
            chosenItems={chosenItems}
            setChosenItems={setChosenItems}
          />
        )}
        {error && <InlineAlert message={error} type="error" />}
        <TradeButtons
          isPending={loading}
          pendingButtonId={loadingButtonId}
          buttons={[
            {
              id: 'show-friend-code',
              label: 'Show friend code',
              onClick: handleShowFriendCode,
              disabled: !chosenItems.my?.id && !chosenItems.my?.colorId,
              shown: gifting && !friendCodeShown,
            },
            {
              id: 'trade-request',
              label: requestedByMe
                ? 'Trade requested'
                : requestedByThem
                  ? 'Accept trade request'
                  : 'Request trade',
              onClick: handleRequestTrade,
              disabled: requestedByMe || !chosenItems.my || !chosenItems.their,
              shown: !gifting && !tradeAccepted,
            },
            {
              id: 'cancel-trade',
              label: 'Cancel trade',
              onClick: () => cancelTrade(traderData.tradeId),
              shown: !gifting && traderData.status === 'pending',
            },
            {
              id: 'finish-trade',
              label: gifting ? 'Finish gifting' : 'Finish trade',
              onClick: handleFinishTrade,
              disabled: traderData.finishedByMe,
              shown: tradeAccepted || (gifting && friendCodeShown),
            },
          ]}
        />
        {showAlert && (
          <TradeAlert
            friendCodeShown={friendCodeShown}
            trader={trader}
            traderData={traderData}
          />
        )}
      </div>
    </Card>
  );
};

const useChosenItems = (traderData: Trader) => {
  const [chosenItems, setChosenItems] = useState<ChosenItems>({
    my: null,
    their: null,
  });

  useEffect(() => {
    if (
      (traderData.status === 'pending' || traderData.status === 'confirmed') &&
      traderData.requestedTrade
    ) {
      const { itemId1, itemId2, colorId1, colorId2 } =
        traderData.requestedTrade;
      setChosenItems(
        traderData.requestedByMe
          ? {
              my: { id: itemId1, colorId: colorId1 },
              their: { id: itemId2, colorId: colorId2 },
            }
          : {
              my: { id: itemId2, colorId: colorId2 },
              their: { id: itemId1, colorId: colorId1 },
            },
      );
    }
  }, [traderData]);

  return { chosenItems, setChosenItems };
};

const getTradeStatus = (traderData: Trader, friendCodeShown: boolean) => ({
  gifting: traderData.has.length === 0,
  requestedByMe: traderData.requestedByMe,
  requestedByThem: traderData.status === 'pending' && !traderData.requestedByMe,
  tradeAccepted: traderData.status === 'confirmed',
  showAlert:
    traderData.requestedByMe ||
    (traderData.status === 'pending' && !traderData.requestedByMe) ||
    traderData.status === 'confirmed' ||
    friendCodeShown,
});

export default TraderCard;
