import { FC } from 'react';
import { getItemName } from '../../utils';
import ColorCircle from '../ui/ColorCircle';
import { ChosenItems } from './TraderCard';
import { useColors, useItems } from '../../context/DataProvider';
import { TradeItem, Trader, User } from '../../types';

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
    <div className="flex flex-col items-center gap-2 justify-center text-gray-600 mt-2">
      {`${trader?.birbName} has nothing to trade, but would like to have:`}
      {traderWantedItems.map((item: TradeItem) => (
        <div
          key={item.itemId + item.colorId}
          className="flex justify-center text-gray-600 mt-2 mb-5"
        >
          <label className="flex items-center space-x-2 cursor-pointer gap-2">
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
            <ColorCircle colors={colors} colorId={item.colorId} />
            {getItemName(items, item.itemId)}
          </label>
        </div>
      ))}
    </div>
  );
};

export default TraderGiftingSection;
