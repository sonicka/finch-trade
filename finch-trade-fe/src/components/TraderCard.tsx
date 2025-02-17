import { FC, useEffect, useState } from "react";
import ColorCircle from "./ColorCircle";
import { useColors } from "../contexts/ColorsProvider";
import { useItems } from "../contexts/ItemsProvider";
import { fetchUser, requestTrade } from "../api";
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

  const requestedByMe = traderData.requestedByMe;
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
      await requestTrade(userId, traderData.userId);
      await refreshTrades();
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  };

  const alertMessage = requestedByThem
    ? `${trader?.username} requested a trade! Once you accept, you'll be able to exchange friend codes and execute the trade!`
    : requestedByMe
    ? `Trade successfully requested! Once ${trader?.username} accepts, you'll see each other's friend codes!`
    : tradeAccepted
    ? `Trade confirmed! ${trader?.username}'s friend code: ${trader?.friendCode}. Please update your lists after finishing the trade.`
    : "";

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
            {traderData.wants.map((item: TradeItem) => (
              <div
                key={item.itemId + item.colorId}
                className="flex justify-center text-gray-600 mt-2 mb-5"
              >
                <ColorCircle colors={colors} colorId={item.colorId} />{" "}
                {getItemName(items, item.itemId)}
              </div>
            ))}
          </div>
        )}
        {!giftOnly && (
          <div className="flex flex-col text-center gap-2 justify-center text-gray-600 mt-2">
            {`${trader?.birbName} would like to have:`}
            {traderData.wants.map((item: TradeItem) => (
              <div
                key={item.itemId + item.colorId}
                className="flex justify-center text-gray-600 mt-2 mb-5"
              >
                <ColorCircle colors={colors} colorId={item.colorId} />{" "}
                {getItemName(items, item.itemId)}
              </div>
            ))}
            {`${trader?.birbName} can give you:`}
            {traderData.has.map((item: TradeItem) => (
              <div
                key={item.itemId + item.colorId}
                className="flex justify-center text-gray-600 mt-2 mb-5"
              >
                <ColorCircle colors={colors} colorId={item.colorId} />{" "}
                {getItemName(items, item.itemId)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-center items-center">
          {giftOnly && !friendCodeShown && (
            <button
              onClick={() => setFriendCodeShown(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Show friend code
            </button>
          )}
          {!giftOnly && !tradeAccepted && (
            <button
              onClick={handleRequestTrade}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              disabled={requestedByMe}
            >
              {requestedByMe
                ? "Trade requested"
                : requestedByThem
                ? "Accept trade request"
                : "Request trade"}
            </button>
          )}
        </div>
        {showAlert && (
          <div className="pt-3">
            <Alert type="success" message={alertMessage} />
          </div>
        )}
        {friendCodeShown && (
          <Alert
            type="success"
            message={`${trader?.username}'s friend code: ${trader?.friendCode}. Don't forget to update your list after gifting.`}
          />
        )}
      </div>
    </div>
  );
};

export default TraderCard;
