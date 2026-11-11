import { FC, useState } from 'react';
import Spinner from './Spinner';
import { alertColors, getAlertMessage } from './alertUtils';

interface InlineAlertProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
}

const InlineAlert: FC<InlineAlertProps> = ({
  message,
  type = 'info',
  action,
}) => {
  const [actionPending, setActionPending] = useState(false);

  const handleAction = async () => {
    setActionPending(true);
    try {
      await action?.onClick();
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div
      className={`relative flex w-full max-w-full items-start justify-between gap-3 rounded-xl border p-4 text-left text-md shadow ${alertColors[type]}`}
      role="alert"
    >
      <span className="min-w-0 flex-1 break-words">
        {getAlertMessage(message, type)}
      </span>
      {action && (
        <button
          type="button"
          className="shrink-0 cursor-pointer font-semibold underline underline-offset-2 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void handleAction()}
          disabled={actionPending}
        >
          {actionPending ? (
            <Spinner
              size={24}
              label="Loading"
              className="shrink-0 border-current border-t-transparent"
            />
          ) : (
            action.label
          )}
        </button>
      )}
    </div>
  );
};

export default InlineAlert;
