import { FC, MouseEventHandler } from 'react';
import Button from '../../shared/components/Button';
import Spinner from '../../shared/components/Spinner';

interface Props {
  isPending: boolean;
  pendingButtonId?: string;
  buttons: {
    id: string;
    label: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
    shown: boolean;
    disabled?: boolean;
  }[];
}

const TradeButtons: FC<Props> = ({ buttons, isPending, pendingButtonId }) => {
  return (
    <div className="flex flex-col items-center gap-2" aria-busy={isPending}>
      {buttons.map((btn) =>
        btn.shown ? (
          <Button
            key={btn.id}
            label={
              isPending && pendingButtonId === btn.id ? (
                <span className="flex items-center justify-center gap-2">
                  {btn.label}
                  <Spinner size={18} label="Updating trade" />
                </span>
              ) : (
                btn.label
              )
            }
            onClick={btn.onClick}
            disabled={isPending || btn.disabled}
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
