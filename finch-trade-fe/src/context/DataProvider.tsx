import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { Color, Item } from '../types';
import { fetchAllItems, fetchColors } from '../api/api';

interface Props {
  children: ReactNode;
}

interface DataContextType {
  colors: Color[];
  allItems: Item[];
  getAllItems: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useColors = (): Color[] => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useColors must be used within a DataProvider');
  return context.colors;
};

export const useItems = (): [Item[], () => Promise<void>] => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useItems must be used within a DataProvider');
  return [context.allItems, context.getAllItems];
};

export const DataProvider = ({ children }: Props) => {
  const [colors, setColors] = useState<Color[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const getColors = useCallback(async () => {
    try {
      const response = await fetchColors();
      setColors(response);
    } catch (error) {
      console.error('Error fetching colors:', error);
    }
  }, []);

  const getAllItems = useCallback(async () => {
    try {
      const response = await fetchAllItems();
      setItems(response);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }, []);

  useEffect(() => {
    getColors();
    getAllItems();
  }, [getColors, getAllItems]);

  return (
    <DataContext.Provider
      value={useMemo(
        () => ({ colors, allItems: items, getAllItems }),
        [colors, items, getAllItems],
      )}
    >
      {children}
    </DataContext.Provider>
  );
};
