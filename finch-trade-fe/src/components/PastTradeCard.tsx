import { FC } from "react";
import { LoggedInUser, PastTrade } from "../types";
import { useUserById } from "../hooks/users";
import ColorCircle from "./ColorCircle";
import { formatDate, getItemName } from "../utils";
import { useColors, useItems } from "../context/DataProvider";

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
    <div className="max-w-md rounded-lg overflow-hidden shadow-lg bg-white mb-8 mt-4 pl-10 pr-10">
      <div className="p-4">
        <div className="flex flex-col text-center text-gray-900 gap-3">
          You traded
          <div className="flex items-center justify-center gap-2">
            <ColorCircle colors={colors} colorId={myItem.colorId} />
            <b>{getItemName(items, myItem.itemId)}</b>
          </div>
          <div>for {`${trader?.birbName}'s`}</div>
          <div className="flex items-center justify-center gap-2">
            <ColorCircle colors={colors} colorId={theirItem.colorId} />
            <b>{getItemName(items, theirItem.itemId)}</b>
          </div>
          <div>on {formatDate(pastTrade.archivedAt)}</div>
        </div>
      </div>
    </div>
  );
};

export default PastTradeCard;
