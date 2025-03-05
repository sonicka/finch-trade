import { FC } from "react";
import Alert from "./Alert";
import { Trader, User } from "../types";

interface Props {
  friendCodeShown: boolean;
  trader?: User;
  traderData: Trader;
}

const TradeAlert: FC<Props> = ({ friendCodeShown, trader, traderData }) => {
  const getAlertMessage = (): string => {
    if (traderData.finishedByMe && traderData.status === "confirmed") {
      return `We're waiting for ${trader?.username} to finish the trade!`;
    }
    if (traderData.status === "confirmed") {
      return `Trade confirmed! ${trader?.username}'s friend code: ${trader?.friendCode}. Don't forget to click above button when you send the item!`;
    }
    if (traderData.status === "pending" && !traderData.requestedByMe) {
      return `${trader?.username} requested a trade! Once you accept, you'll be able to exchange friend codes and execute the trade!`;
    }
    if (traderData.requestedByMe) {
      return `Trade successfully requested! Once ${trader?.username} accepts, you'll see each other's friend codes!`;
    }
    if (friendCodeShown) {
      return `${trader?.username}'s friend code: ${trader?.friendCode}. Don't forget to confirm sending the item by clicking the button above.`;
    }
    return "";
  };

  return (
    <div className="pt-4">
      <Alert type="success" message={getAlertMessage()} />
    </div>
  );
};

export default TradeAlert;
