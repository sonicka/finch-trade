import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addItem, deleteItem } from '../../api/api';
import { ListType } from '../types';
import { useUser, userDataQueryKeys } from '../context/UserProvider';
import { useItems } from '../context/DataProvider';

export interface ItemSuccessMessage {
  id: number;
  message: string;
  undo?: {
    name: string;
    colorId: number;
    type: ListType;
  };
}

type ItemMutation =
  | {
      action: 'add';
      payload: { name: string; colorId: number; type: ListType };
    }
  | {
      action: 'remove';
      payload: {
        itemId: number;
        name: string;
        colorId: number;
        type: ListType;
      };
    };

export const useManageItem = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const [, getAllItems] = useItems();
  const [successes, setSuccesses] = useState<ItemSuccessMessage[]>([]);
  const mutation = useMutation({
    mutationFn: async ({ action, payload }: ItemMutation) => {
      if (action === 'add') {
        return addItem({
          name: payload.name,
          color: payload.colorId,
          listType: payload.type,
        });
      }

      return deleteItem(payload.itemId, payload.colorId, payload.type);
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

  const handleItem = async (variables: ItemMutation): Promise<boolean> => {
    const { action, payload } = variables;
    mutation.reset();

    try {
      const response = await mutation.mutateAsync(variables);

      if (action === 'add') {
        await getAllItems();
      }

      if (response?.message) {
        setSuccesses((current) => [
          ...current,
          {
            id: Date.now() + Math.random(),
            message: response.message,
            ...(action === 'remove'
              ? {
                  undo: {
                    name: payload.name,
                    colorId: payload.colorId,
                    type: payload.type,
                  },
                }
              : {}),
          },
        ]);
      }
      return true;
    } catch {
      return false;
    }
  };

  const addNewItem = (name: string, colorId: number, type: ListType) =>
    handleItem({ action: 'add', payload: { name, colorId, type } });

  const removeItem = (
    itemId: number,
    name: string,
    colorId: number,
    type: ListType,
  ) =>
    handleItem({ action: 'remove', payload: { itemId, name, colorId, type } });

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
  const removingItem =
    mutation.isPending && mutation.variables?.action === 'remove'
      ? {
          itemId: mutation.variables.payload.itemId,
          colorId: mutation.variables.payload.colorId,
        }
      : undefined;

  return {
    addNewItem,
    removeItem,
    error,
    successes,
    clearMessage,
    loading: mutation.isPending,
    isAdding: mutation.isPending && mutation.variables?.action === 'add',
    removingItem,
  };
};
