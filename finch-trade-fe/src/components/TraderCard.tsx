import { FC, useEffect, useState } from "react";
import ColorCircle from "./ColorCircle";
import { useColors } from "../contexts/ColorsProvider";
import { useItems } from "../contexts/ItemsProvider";
import { fetchUser, finishTrade, removeItem, requestTrade } from "../api";
import { getItemName } from "../utils";
import { TradeItem, Trader, User } from "../types";
import Alert from "./Alert";

interface Props {
  traderData: Trader;
  userId: number;
  refreshTrades: Function;
}

const TraderCard: FC<Props> = ({
  traderData,
  userId,
  refreshTrades,
}: Props) => {
  const colors = useColors();
  const items = useItems();
  const [trader, setTrader] = useState<User>();
  const [friendCodeShown, setFriendCodeShown] = useState<boolean>(false);
  const giftOnly = traderData.has.length === 0;
  const [chosenItems, setChosenItems] = useState<{
    my: { id: number; colorId: number } | null;
    their: { id: number; colorId: number } | null;
  }>({ my: null, their: null });

  const ownedItems =
    traderData.status === "pending" || traderData.status === "confirmed"
      ? traderData.has.filter(
          (i) =>
            (i.itemId === traderData.requestedTrade?.itemId1 &&
              i.colorId === traderData.requestedTrade?.colorId1) ||
            (i.itemId === traderData.requestedTrade?.itemId2 &&
              i.colorId === traderData.requestedTrade?.colorId2)
        )
      : traderData.has;
  const wantedItems =
    traderData.status === "pending" || traderData.status === "confirmed"
      ? traderData.wants.filter(
          (i) =>
            (i.itemId === traderData.requestedTrade?.itemId1 &&
              i.colorId === traderData.requestedTrade?.colorId1) ||
            (i.itemId === traderData.requestedTrade?.itemId2 &&
              i.colorId === traderData.requestedTrade?.colorId2)
        )
      : traderData.wants;

  useEffect(() => {
    if (
      (traderData.status === "pending" || traderData.status === "confirmed") &&
      traderData.requestedTrade
    ) {
      const { itemId1, itemId2, colorId1, colorId2 } =
        traderData.requestedTrade;
      if (traderData.requestedByMe) {
        setChosenItems({
          my: { id: itemId1, colorId: colorId1 },
          their: { id: itemId2, colorId: colorId2 },
        });
      } else {
        setChosenItems({
          my: { id: itemId2, colorId: colorId2 },
          their: { id: itemId1, colorId: colorId1 },
        });
      }
    }
  }, [traderData, userId]);

  const requestedByMe = traderData.requestedByMe;
  const gifting = !!chosenItems.my && !chosenItems.their;
  const requestedByThem =
    traderData.status === "pending" && !traderData.requestedByMe;
  const tradeAccepted = traderData.status === "confirmed";
  const showAlert = requestedByMe || requestedByThem || tradeAccepted;

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetchUser(traderData.userId);
        setTrader(response);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    if (traderData.userId) getUser();
  }, [traderData.userId]);

  const handleRequestTrade = async () => {
    try {
      await requestTrade(userId, traderData.userId, chosenItems);
      await refreshTrades();
    } catch (error) {
      console.error("Error requesting trade:", error);
    }
  };

  const handleFinishTrade = async () => {
    try {
      if (gifting && chosenItems.my) {
        await removeItem(
          chosenItems.my?.id,
          chosenItems.my?.colorId,
          "tradelist",
          userId
        );
        setChosenItems({ my: null, their: null });
      } else {
        await finishTrade(traderData.tradeId, userId);
      }
      setFriendCodeShown(false);
      setChosenItems({ my: null, their: null });
      await refreshTrades();
    } catch (error) {
      console.error("Error finishing trades:", error);
    }
  };

  const getAlertMessage = (): string => {
    if (traderData.finishedByMe && traderData.status === "confirmed") {
      return `We're waiting for ${trader?.username} to finish the trade!`;
    }
    if (tradeAccepted) {
      return `Trade confirmed! ${trader?.username}'s friend code: ${trader?.friendCode}. Don't forget to click above button when you send the item!`;
    }
    if (requestedByThem) {
      return `${trader?.username} requested a trade! Once you accept, you'll be able to exchange friend codes and execute the trade!`;
    }
    if (requestedByMe) {
      return `Trade successfully requested! Once ${trader?.username} accepts, you'll see each other's friend codes!`;
    }
    return "";
  };

  return (
    <div className="max-w-md rounded-lg overflow-hidden shadow-lg bg-white mb-8 mt-4 pl-10 pr-10">
      <div className="p-4 pt-8 pb-8">
        <h2 className="text-xl mb-5 text-center font-semibold text-gray-900">
          You have matched with
          <br />
          <b>{`${trader?.birbName} & ${trader?.username}!`}</b>
        </h2>
        {giftOnly && (
          <div className="flex flex-col gap-2 justify-center text-gray-600 mt-2">
            {`${trader?.birbName} has nothing to trade, but would like to have:`}
            {wantedItems.map((item: TradeItem) => (
              <div
                key={item.itemId + item.colorId}
                className="flex justify-center text-gray-600 mt-2 mb-5"
              >
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theirTradeItem"
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    checked={
                      chosenItems.my?.id === item.itemId &&
                      chosenItems.my?.colorId === item.colorId
                    }
                    onChange={() =>
                      setChosenItems({
                        ...chosenItems,
                        my: { id: item.itemId, colorId: item.colorId },
                      })
                    }
                  />
                  <>
                    <div className="pr-1">
                      <ColorCircle colors={colors} colorId={item.colorId} />
                    </div>
                    {getItemName(items, item.itemId)}
                  </>
                </label>
              </div>
            ))}
          </div>
        )}
        {!giftOnly && (
          <div className="flex flex-col text-center gap-2 justify-center text-gray-600 mt-2">
            {`${trader?.birbName} would like to have:`}
            {wantedItems.map((item: TradeItem) => (
              <div
                key={item.itemId + item.colorId}
                className="flex justify-center text-gray-600 mt-2 mb-5"
              >
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="myTradeItem"
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    checked={
                      chosenItems.my?.id === item.itemId &&
                      chosenItems.my?.colorId === item.colorId
                    }
                    onChange={() =>
                      setChosenItems({
                        ...chosenItems,
                        my: { id: item.itemId, colorId: item.colorId },
                      })
                    }
                    disabled={
                      traderData.status === "pending" ||
                      traderData.status === "confirmed"
                    }
                  />
                  <>
                    <div className="pr-1">
                      <ColorCircle colors={colors} colorId={item.colorId} />
                    </div>
                    {getItemName(items, item.itemId)}
                  </>
                </label>
              </div>
            ))}
            {`${trader?.birbName} can give you:`}
            {ownedItems.map((item: TradeItem) => (
              <div
                key={item.itemId + item.colorId}
                className="flex justify-center text-gray-600 mt-2 mb-5"
              >
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theirTradeItem"
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                    checked={
                      chosenItems.their?.id === item.itemId &&
                      chosenItems.their?.colorId === item.colorId
                    }
                    onChange={() =>
                      setChosenItems({
                        ...chosenItems,
                        their: { id: item.itemId, colorId: item.colorId },
                      })
                    }
                    disabled={
                      traderData.status === "pending" ||
                      traderData.status === "confirmed"
                    }
                  />
                  <>
                    <div className="pr-1">
                      <ColorCircle colors={colors} colorId={item.colorId} />
                    </div>
                    {getItemName(items, item.itemId)}
                  </>
                </label>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-center items-center">
          {giftOnly && !friendCodeShown && (
            <button
              onClick={() => setFriendCodeShown(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={!chosenItems.my?.id && !chosenItems.my?.colorId}
            >
              Show friend code
            </button>
          )}
          {!giftOnly && !tradeAccepted && (
            <button
              onClick={handleRequestTrade}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={requestedByMe || !chosenItems.my || !chosenItems.their}
            >
              {requestedByMe
                ? "Trade requested"
                : requestedByThem
                ? "Accept trade request"
                : "Request trade"}
            </button>
          )}
          {tradeAccepted && (
            <button
              onClick={handleFinishTrade}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={traderData.finishedByMe}
            >
              I sent the item!
            </button>
          )}
          {gifting && friendCodeShown && (
            <button
              onClick={handleFinishTrade}
              className="bg-blue-500 text-white px-4 py-2 mb-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={traderData.finishedByMe}
            >
              I sent the item!
            </button>
          )}
        </div>
        {showAlert && (
          <div className="pt-3">
            <Alert type="success" message={getAlertMessage()} />
          </div>
        )}
        {friendCodeShown && (
          <Alert
            type="success"
            message={`${trader?.username}'s friend code: ${trader?.friendCode}. Don't forget to confirm sending the item by clicking the button above.`}
          />
        )}
      </div>
    </div>
  );
};

export default TraderCard;
