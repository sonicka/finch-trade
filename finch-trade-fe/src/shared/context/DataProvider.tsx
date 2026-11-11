import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Color, Item } from '../types';
import { fetchAllItems, fetchColors } from '../../api/api';

interface Props {
  children: ReactNode;
}

interface DataContextType {
  colors: Color[];
  allItems: Item[];
  getAllItems: () => Promise<void>;
  catalogLoading: boolean;
  catalogError: string | null;
  retryCatalog: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const catalogQueryKeys = {
  colors: ['catalog', 'colors'] as const,
  items: ['catalog', 'items'] as const,
};

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

export const useCatalogStatus = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useCatalogStatus must be used within a DataProvider');
  }

  return {
    isLoading: context.catalogLoading,
    error: context.catalogError,
    retry: context.retryCatalog,
  };
};

export const DataProvider = ({ children }: Props) => {
  const queryClient = useQueryClient();
  const colorsQuery = useQuery({
    queryKey: catalogQueryKeys.colors,
    queryFn: fetchColors,
  });
  const itemsQuery = useQuery({
    queryKey: catalogQueryKeys.items,
    queryFn: fetchAllItems,
  });
  const getAllItems = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: catalogQueryKeys.items });
  }, [queryClient]);
  const retryCatalog = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.colors }),
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.items }),
    ]);
  }, [queryClient]);
  const catalogError = colorsQuery.isError
    ? 'Could not load the color catalog.'
    : itemsQuery.isError
      ? 'Could not load the item catalog.'
      : null;

  return (
    <DataContext.Provider
      value={useMemo(
        () => ({
          colors: colorsQuery.data ?? [],
          allItems: itemsQuery.data ?? [],
          getAllItems,
          catalogLoading: colorsQuery.isPending || itemsQuery.isPending,
          catalogError,
          retryCatalog,
        }),
        [
          colorsQuery.data,
          colorsQuery.isPending,
          itemsQuery.data,
          itemsQuery.isPending,
          getAllItems,
          catalogError,
          retryCatalog,
        ],
      )}
    >
      {children}
    </DataContext.Provider>
  );
};
