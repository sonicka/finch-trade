import { FC } from 'react';
import ColorCircle from '../ui/ColorCircle';
import { ChosenItems } from './TraderCard';
import { useColors, useItems } from '../../context/DataProvider';
import { filterRequestedItems, getItemName } from '../../utils';
import { TradeItem, Trader, User } from '../../types';

interface Props {
  trader: User;
  traderData: Trader;
  chosenItems: ChosenItems;
  setChosenItems: React.Dispatch<React.SetStateAction<ChosenItems>>;
}

const TraderTradingSection: FC<Props> = ({
  trader,
  traderData,
  chosenItems,
  setChosenItems,
}) => {
  const colors = useColors();
  const [items] = useItems();

  const isTradeOngoing =
    traderData.status === 'pending' || traderData.status === 'confirmed';

  const traderWantedItems = isTradeOngoing
    ? filterRequestedItems(traderData.wants, traderData.requestedTrade)
    : traderData.wants;

  const traderOwnedItems = isTradeOngoing
    ? filterRequestedItems(traderData.has, traderData.requestedTrade)
    : traderData.has;

  return (
    <div className="flex flex-col text-center gap-2 justify-center text-gray-600 mt-2">
      {`${trader?.birbName} would like to have:`}
      {traderWantedItems.map((item: TradeItem) => (
        <div
          key={item.itemId + '' + item.colorId}
          className="flex justify-center text-gray-600 mt-2 mb-5"
        >
          <label className="flex items-center space-x-2 cursor-pointer gap-2">
            <input
              type="radio"
              name={`myTradeItem-${trader.friendCode}`}
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
              disabled={isTradeOngoing}
            />
            <ColorCircle colors={colors} colorId={item.colorId} />
            {getItemName(items, item.itemId)}
          </label>
        </div>
      ))}
      {`${trader?.birbName} can give you:`}
      {traderOwnedItems.map((item: TradeItem) => (
        <div
          key={item.itemId + '' + item.colorId}
          className="flex justify-center text-gray-600 mt-2 mb-5"
        >
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={`theirTradeItem-${trader.friendCode}`}
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
              disabled={isTradeOngoing}
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

export default TraderTradingSection;
