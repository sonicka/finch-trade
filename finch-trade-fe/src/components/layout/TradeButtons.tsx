import { FC, MouseEventHandler } from "react";
import Button from "../ui/Button";

interface Props {
  buttons: {
    id: string;
    label: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
    shown: boolean;
    disabled?: boolean;
  }[];
}

const TradeButtons: FC<Props> = ({ buttons }) => {
  return (
    <div className="mt-4 flex justify-center items-center">
      {buttons.map((btn) =>
        btn.shown ? (
          <Button
            key={btn.id}
            label={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
          />
        ) : null
      )}
    </div>
  );
};

export default TradeButtons;
