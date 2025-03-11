import { FC } from "react";
import { PastGift } from "../types";
import { useUserById } from "../hooks/users";
import ColorCircle from "./ColorCircle";
import { formatDate, getItemName } from "../utils";
import { useColors, useItems } from "../context/DataProvider";

interface Props {
  pastTrade: PastGift;
  traderId: number;
}

const PastGiftCard: FC<Props> = ({ pastTrade, traderId }) => {
  const trader = useUserById(traderId);
  const colors = useColors();
  const [items] = useItems();

  if (!trader) return null;

  return (
    <div className="max-w-md rounded-lg overflow-hidden shadow-lg bg-white mb-8 mt-4 pl-10 pr-10">
      <div className="p-4 flex gap-5">
        <div className="flex flex-col text-center text-gray-900 gap-3">
          You gifted
          <div className="flex items-center justify-center gap-2">
            <ColorCircle colors={colors} colorId={pastTrade.colorId} />
            <b>{getItemName(items, pastTrade.itemId)}</b>
          </div>
          <div>to {`${trader.username} & ${trader?.birbName}`}</div>
          <div>on {formatDate(pastTrade.archivedAt)}</div>
        </div>
      </div>
    </div>
  );
};

export default PastGiftCard;
