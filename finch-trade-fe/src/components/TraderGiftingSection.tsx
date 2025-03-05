import { FC } from "react";
import { TradeItem, Trader, User } from "../types";
import { getItemName } from "../utils";
import ColorCircle from "./ColorCircle";
import { ChosenItems } from "./TraderCard";
import { useColors, useItems } from "../context/DataProvider";

interface Props {
  trader: User;
  traderData: Trader;
  chosenItems: ChosenItems;
  setChosenItems: React.Dispatch<React.SetStateAction<ChosenItems>>;
}

const TraderGiftingSection: FC<Props> = ({
  trader,
  traderData,
  chosenItems,
  setChosenItems,
}) => {
  const colors = useColors();
  const [items] = useItems();

  const traderWantedItems = traderData.wants;

  return (
    <div className="flex flex-col gap-2 justify-center text-gray-600 mt-2">
      {`${trader?.birbName} has nothing to trade, but would like to have:`}
      {traderWantedItems.map((item: TradeItem) => (
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
  );
};

export default TraderGiftingSection;
