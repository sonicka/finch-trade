import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import IconButton from './IconButton';

export interface AlertProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  autoHide?: boolean;
}

interface AlertEntry extends AlertProps {
  id: number;
}

interface AlertContextValue {
  register: (entry: AlertEntry) => void;
  clear: (type?: AlertProps['type']) => void;
  remove: (id: number) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const AlertMessage: FC<AlertEntry & { onClose: () => void }> = ({
  message,
  type = 'info',
  autoHide,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);
  const shouldAutoHide = autoHide ?? type !== 'error';

  useEffect(() => {
    setVisible(true);
    if (!shouldAutoHide) return;

    const fadeTimer = setTimeout(() => setVisible(false), 2500);
    const removeTimer = setTimeout(onClose, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [shouldAutoHide]);

  const colors = {
    error: 'bg-red-100 border-red-400 text-red-700',
    success: 'bg-green-100 border-green-400 text-green-700',
    info: 'bg-lightBeige border-darkBeige text-darkBeige',
  };

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border p-4 text-left text-md shadow transition-opacity duration-500 ${colors[type]} ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="alert"
    >
      <span className="min-w-0 flex-1 break-words">
        {message ||
          (type === 'error'
            ? 'Something went wrong. Please try again later.'
            : type === 'success'
              ? 'Success.'
              : '')}
      </span>
      {!shouldAutoHide && (
        <IconButton
          color={
            type === 'error' ? 'red' : type === 'success' ? 'green' : 'beige'
          }
          icon={
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
              clipRule="evenodd"
            />
          }
          onClick={onClose}
          buttonProps={{ 'aria-label': 'Close alert' }}
          className="border-none"
        />
      )}
    </div>
  );
};

export const AlertProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);

  const register = useCallback((entry: AlertEntry) => {
    setAlerts((current) =>
      current.some(({ id }) => id === entry.id) ? current : [...current, entry],
    );
  }, []);

  const remove = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const clear = useCallback((type?: AlertProps['type']) => {
    setAlerts((current) =>
      type ? current.filter((alert) => alert.type !== type) : [],
    );
  }, []);

  useEffect(() => {
    const clearErrorsOnClick = () => clear('error');
    document.addEventListener('click', clearErrorsOnClick);

    return () => document.removeEventListener('click', clearErrorsOnClick);
  }, [clear]);

  const contextValue = useMemo(
    () => ({ register, clear, remove }),
    [clear, register, remove],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-28 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {alerts.map((alert) => (
          <div className="pointer-events-auto" key={alert.id}>
            <AlertMessage {...alert} onClose={() => remove(alert.id)} />
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};

const Alert: FC<AlertProps> = (props) => {
  const context = useContext(AlertContext);
  const lastAlertKey = useRef<string | null>(null);

  if (!context) {
    throw new Error('Alert must be rendered inside AlertProvider');
  }

  useEffect(() => {
    const alertKey = `${props.message}\u0000${props.type ?? ''}\u0000${props.autoHide ?? ''}`;
    if (lastAlertKey.current === alertKey) return;

    context.register({ ...props, id: Date.now() + Math.random() });
    lastAlertKey.current = alertKey;
  }, [context, props.message, props.type, props.autoHide]);

  useEffect(() => {
    return () => {
      lastAlertKey.current = null;
    };
  }, []);

  return null;
};

export default Alert;
