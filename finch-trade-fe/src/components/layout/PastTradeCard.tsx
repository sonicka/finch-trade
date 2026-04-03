import { FC } from 'react';
import Card from '../ui/Card';
import ColorCircle from '../ui/ColorCircle';
import { useColors, useItems } from '../../context/DataProvider';
import { useUserById } from '../../hooks/users';
import { formatDate, getItemName } from '../../utils';
import { LoggedInUser, PastTrade } from '../../types';

interface Props {
  pastTrade: PastTrade;
  user: LoggedInUser;
  traderId: number;
}

const PastTradeCard: FC<Props> = ({ pastTrade, user, traderId }) => {
  const trader = useUserById(traderId);
  const colors = useColors();
  const [items] = useItems();

  const myItem =
    user.id === pastTrade.userId1
      ? { itemId: pastTrade.itemId1, colorId: pastTrade.colorId1 }
      : { itemId: pastTrade.itemId2, colorId: pastTrade.colorId2 };

  const theirItem =
    traderId === pastTrade.userId1
      ? { itemId: pastTrade.itemId1, colorId: pastTrade.colorId1 }
      : { itemId: pastTrade.itemId2, colorId: pastTrade.colorId2 };

  if (!trader) return null;

  return (
    <Card simple>
      <div className="flex flex-col text-center gap-4 py-8">
        You traded
        <div className="flex items-center justify-center gap-2">
          <ColorCircle colors={colors} colorId={myItem.colorId} />
          <b>{getItemName(items, myItem.itemId)}</b>
        </div>
        <div>for {`${trader.username} & ${trader.birbName}'s`}</div>
        <div className="flex items-center justify-center gap-2">
          <ColorCircle colors={colors} colorId={theirItem.colorId} />
          <b>{getItemName(items, theirItem.itemId)}</b>
        </div>
        <div>on {formatDate(pastTrade.archivedAt)}</div>
      </div>
    </Card>
  );
};

export default PastTradeCard;
