import { FC, MouseEventHandler } from 'react';
import Button from '../../shared/components/Button';

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
    <div className="flex flex-col items-center gap-2">
      {buttons.map((btn) =>
        btn.shown ? (
          <Button
            key={btn.id}
            label={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={
              btn.id === 'cancel-trade'
                ? 'underline text-darkBeige hover:text-mediumBeige cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'
                : undefined
            }
          />
        ) : null,
      )}
    </div>
  );
};

export default TradeButtons;
