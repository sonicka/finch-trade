import { FC } from 'react';
import { PastGift } from '../../shared/types';
import { useUserById } from '../../shared/hooks/users';
import Card from '../../shared/components/Card';
import ColorCircle from '../../shared/components/ColorCircle';
import { formatDate, getItemName } from '../../shared/utils';
import { useColors, useItems } from '../../shared/context/DataProvider';

interface Props {
  pastTrade: PastGift;
  traderId: number;
}

const PastGiftCard: FC<Props> = ({ pastTrade, traderId }) => {
  const trader = useUserById(traderId);
  const colors = useColors();
  const [items] = useItems();

  if (!trader) return null;

  const isReceived = pastTrade.type === 'giftReceived';
  const actionText = isReceived ? 'You have been gifted' : 'You gifted';
  const preposition = isReceived ? 'from' : 'to';

  return (
    <Card simple>
      <div className="flex flex-col text-center text-gray-900 gap-4 py-8">
        {actionText}
        <div className="flex items-center justify-center gap-2">
          <ColorCircle colors={colors} colorId={pastTrade.colorId} />
          <b>{getItemName(items, pastTrade.itemId)}</b>
        </div>
        <div>{`${preposition} ${trader.username} & ${trader?.birbName}`}</div>
        <div>on {formatDate(pastTrade.archivedAt)}</div>
      </div>
    </Card>
  );
};

export default PastGiftCard;
