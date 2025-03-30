import { FC, useEffect, useState } from "react";
import TraderTradingSection from "./TraderTradingSection";
import TraderGiftingSection from "./TraderGiftingSection";
import TradeButtons from "./TradeButtons";
import TradeAlert from "./TradeAlert";
import Card from "../ui/Card";
import { useTrades } from "../../context/UserProvider";
import { useManageTrade } from "../../hooks/trades";
import { useUserById } from "../../hooks/users";
import { ChosenItem, Trader } from "../../types";

interface Props {
  traderData: Trader;
  userId: number;
}

export interface ChosenItems {
  my: ChosenItem | null;
  their: ChosenItem | null;
}

const TraderCard: FC<Props> = ({ traderData, userId }) => {
  const trader = useUserById(traderData.userId);
  const { chosenItems, setChosenItems } = useChosenItems(traderData);
  const { requestTrade, finishTrade, finishGifting } = useManageTrade();
  const { getPastTrades } = useTrades();
  const [friendCodeShown, setFriendCodeShown] = useState<boolean>(false);
  const { gifting, requestedByMe, requestedByThem, tradeAccepted, showAlert } =
    getTradeStatus(traderData, friendCodeShown);

  const handleShowFriendCode = () => setFriendCodeShown(true);

  const handleRequestTrade = () =>
    requestTrade(userId, traderData.userId, chosenItems);

  const handleFinishTrade = async () => {
    if (gifting && chosenItems.my?.id)
      await finishGifting(
        userId,
        traderData.userId,
        chosenItems.my?.id,
        chosenItems.my?.colorId
      );
    else await finishTrade(traderData.tradeId, userId, chosenItems);
    setFriendCodeShown(false);
    setChosenItems({ my: null, their: null });
    await getPastTrades();
  };

  if (!trader) return null;

  return (
    <Card simple>
      <div className="py-8 px-4">
        <h2 className="text-xl mb-5 text-center font-semibold text-gray-900">
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
        <TradeButtons
          buttons={[
            {
              id: "show-friend-code",
              label: "Show friend code",
              onClick: handleShowFriendCode,
              disabled: !chosenItems.my?.id && !chosenItems.my?.colorId,
              shown: gifting && !friendCodeShown,
            },
            {
              id: "trade-request",
              label: requestedByMe
                ? "Trade requested"
                : requestedByThem
                ? "Accept trade request"
                : "Request trade",
              onClick: handleRequestTrade,
              disabled: requestedByMe || !chosenItems.my || !chosenItems.their,
              shown: !gifting && !tradeAccepted,
            },
            {
              id: "finish-trade",
              label: "Finish trade",
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
      (traderData.status === "pending" || traderData.status === "confirmed") &&
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
            }
      );
    }
  }, [traderData]);

  return { chosenItems, setChosenItems };
};

const getTradeStatus = (traderData: Trader, friendCodeShown: boolean) => ({
  gifting: traderData.has.length === 0,
  requestedByMe: traderData.requestedByMe,
  requestedByThem: traderData.status === "pending" && !traderData.requestedByMe,
  tradeAccepted: traderData.status === "confirmed",
  showAlert:
    traderData.requestedByMe ||
    (traderData.status === "pending" && !traderData.requestedByMe) ||
    traderData.status === "confirmed" ||
    friendCodeShown,
});

export default TraderCard;
