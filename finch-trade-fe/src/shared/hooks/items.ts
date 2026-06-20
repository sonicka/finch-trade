import { useState } from 'react';
import { addItem, deleteItem } from '../../api/api';
import { ListType } from '../types';
import { useUserData } from '../context/UserProvider';
import { useItems } from '../context/DataProvider';

export const useManageItem = () => {
  const { getUserItems, listChanged, toggleListChange } = useUserData();
  const [, getAllItems] = useItems();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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

    setLoading(true);
    setError(null);

    try {
      let response;
      if (action === 'add') {
        if (!payload.name) return;
        response = await addItem({
          name: payload.name,
          color: payload.colorId,
          listType: payload.type,
        });
        await getAllItems();
      }
      if (action === 'remove') {
        response = await deleteItem(
          payload.itemId!,
          payload.colorId,
          payload.type,
        );
      }

      if (response?.message) setSuccess(response.message);

      await getUserItems(payload.type);
      if (!listChanged) toggleListChange(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e?.message : `Failed to ${action} item`);
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = (name: string, colorId: number, type: ListType) =>
    handleItem('add', { name, colorId, type });

  const removeItem = (itemId: number, colorId: number, type: ListType) =>
    handleItem('remove', { itemId, colorId, type });

  const clearMessage = () => {
    setSuccess(null);
    setError(null);
  };

  return { addNewItem, removeItem, error, success, clearMessage, loading };
};
