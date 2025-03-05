import { FC, MouseEventHandler } from "react";

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
          <button
            key={btn.id}
            onClick={btn.onClick}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            disabled={btn.disabled}
          >
            {btn.label}
          </button>
        ) : null
      )}
    </div>
  );
};

export default TradeButtons;
