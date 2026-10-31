import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ChosenItem } from '../types';

interface PendingGift {
  item: ChosenItem | null;
  friendCodeShown: boolean;
}

interface PendingGiftContextType {
  pendingGifts: Record<string, PendingGift>;
  updatePendingGift: (key: string, update: Partial<PendingGift>) => void;
  clearPendingGift: (key: string) => void;
}

interface Props {
  children: ReactNode;
}

const PendingGiftContext = createContext<PendingGiftContextType | null>(null);

export const PendingGiftProvider = ({ children }: Props) => {
  const [pendingGifts, setPendingGifts] = useState<Record<string, PendingGift>>(
    {},
  );

  const updatePendingGift = useCallback(
    (key: string, update: Partial<PendingGift>) => {
      setPendingGifts((current) => ({
        ...current,
        [key]: {
          ...(current[key] ?? { item: null, friendCodeShown: false }),
          ...update,
        },
      }));
    },
    [],
  );

  const clearPendingGift = useCallback((key: string) => {
    setPendingGifts((current) => {
      const remainingGifts = { ...current };
      delete remainingGifts[key];
      return remainingGifts;
    });
  }, []);

  const value = useMemo(
    () => ({ pendingGifts, updatePendingGift, clearPendingGift }),
    [pendingGifts, updatePendingGift, clearPendingGift],
  );

  return (
    <PendingGiftContext.Provider value={value}>
      {children}
    </PendingGiftContext.Provider>
  );
};

export const usePendingGift = (userId: number, recipientId: number) => {
  const context = useContext(PendingGiftContext);
  if (!context) {
    throw new Error('usePendingGift must be used within a PendingGiftProvider');
  }

  const key = `${userId}:${recipientId}`;
  const pendingGift = context.pendingGifts[key] ?? {
    item: null,
    friendCodeShown: false,
  };

  return {
    pendingGift,
    updatePendingGift: (update: Partial<PendingGift>) =>
      context.updatePendingGift(key, update),
    clearPendingGift: () => context.clearPendingGift(key),
  };
};
