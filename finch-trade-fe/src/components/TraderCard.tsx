import { FC, useEffect, useState } from "react";
import ColorCircle from "./ColorCircle";
import { useColors } from "../contexts/ColorsProvider";
import { useItems } from "../contexts/ItemsProvider";
import { fetchUser } from "../api";
import { getItemName } from "../utils";
import { TradeItem, Trader, User } from "../types";

interface Props {
  traderData: Trader;
}

const TraderCard: FC<Props> = ({ traderData }: Props) => {
  const colors = useColors();
  const items = useItems();
  const [trader, setTrader] = useState<User>();
  const giftOnly = traderData.has.length === 0;

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

  return (
    <div className="max-w-md rounded-lg overflow-hidden shadow-lg bg-white mb-8 pl-10 pr-10">
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
                {item.itemId}
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
          {giftOnly && (
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Show friend code
              {/* // todo onClick */}
            </button>
          )}
          {!giftOnly && (
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
              Request trade
              {/* // todo onClick */}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraderCard;
