import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addItem, deleteItem } from '../../api/api';
import { ListType } from '../types';
import { useUser, userDataQueryKeys } from '../context/UserProvider';
import { useItems } from '../context/DataProvider';

export interface ItemSuccessMessage {
  id: number;
  message: string;
}

export const useManageItem = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const [, getAllItems] = useItems();
  const [successes, setSuccesses] = useState<ItemSuccessMessage[]>([]);
  const mutation = useMutation({
    mutationFn: async ({
      action,
      payload,
    }: {
      action: 'add' | 'remove';
      payload: {
        itemId?: number;
        name?: string;
        colorId: number;
        type: ListType;
      };
    }) => {
      if (action === 'add') {
        return addItem({
          name: payload.name!,
          color: payload.colorId,
          listType: payload.type,
        });
      }

      return deleteItem(payload.itemId!, payload.colorId, payload.type);
    },
    onSuccess: async () => {
      if (!user?.id) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: userDataQueryKeys.items(user.id),
        }),
        queryClient.invalidateQueries({
          queryKey: userDataQueryKeys.trades(user.id),
        }),
      ]);
    },
  });

  const handleItem = async (
    action: 'add' | 'remove',
    payload: {
      itemId?: number;
      name?: string;
      colorId: number;
      type: ListType;
    },
  ) => {
    if (!payload.colorId || (action === 'remove' && !payload.itemId)) {
      return;
    }

    mutation.reset();

    try {
      if (action === 'add' && !payload.name) return;
      const response = await mutation.mutateAsync({ action, payload });

      if (action === 'add') {
        await getAllItems();
      }

      if (response?.message) {
        setSuccesses((current) => [
          ...current,
          { id: Date.now() + Math.random(), message: response.message },
        ]);
      }
    } catch {
      // The mutation retains the error for the UI.
    }
  };

  const addNewItem = (name: string, colorId: number, type: ListType) =>
    handleItem('add', { name, colorId, type });

  const removeItem = (itemId: number, colorId: number, type: ListType) =>
    handleItem('remove', { itemId, colorId, type });

  const clearMessage = () => {
    setSuccesses([]);
    mutation.reset();
  };

  const error =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? 'Failed to update item'
        : null;

  return {
    addNewItem,
    removeItem,
    error,
    successes,
    clearMessage,
    loading: mutation.isPending,
  };
};
