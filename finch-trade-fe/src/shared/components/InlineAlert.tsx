import { FC } from 'react';
import { alertColors, getAlertMessage } from './alertUtils';

interface InlineAlertProps {
  message: string;
  type?: 'error' | 'success' | 'info';
}

const InlineAlert: FC<InlineAlertProps> = ({ message, type = 'info' }) => (
  <div
    className={`relative flex items-start gap-3 rounded-xl border p-4 text-left text-md shadow ${alertColors[type]}`}
    role="alert"
  >
    <span className="min-w-0 flex-1 break-words">
      {getAlertMessage(message, type)}
    </span>
  </div>
);

export default InlineAlert;
