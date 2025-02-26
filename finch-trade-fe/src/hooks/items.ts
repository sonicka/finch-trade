import { useState } from "react";
import { addItem, deleteItem } from "../api/api";
import { ListType } from "../types";
import { useUserData } from "../context/UserProvider";
import { useItems } from "../context/DataProvider";

export const useManageItem = () => {
  const { getUserItems, listChanged, toggleListChange } = useUserData();
  const [_, getAllItems] = useItems();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleItem = async (
    action: "add" | "remove",
    payload: {
      itemId?: number;
      name?: string;
      colorId: number;
      type: ListType;
      userId: number;
    }
  ) => {
    if (
      !payload.userId ||
      !payload.colorId ||
      (action === "remove" && !payload.itemId)
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (action === "add") {
        if (!payload.name) return;
        await addItem({
          name: payload.name,
          color: payload.colorId,
          userId: payload.userId,
          listType: payload.type,
        });
        await getAllItems();
      }
      if (action === "remove") {
        await deleteItem(
          payload.itemId!,
          payload.colorId,
          payload.type,
          payload.userId
        );
      }

      await getUserItems(payload.type);
      if (!listChanged) toggleListChange(true);
    } catch (e: any) {
      setError(e?.message || `Failed to ${action} item`);
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = (
    name: string,
    colorId: number,
    type: ListType,
    userId: number
  ) => handleItem("add", { name, colorId, userId, type });

  const removeItem = (
    itemId: number,
    colorId: number,
    type: ListType,
    userId: number
  ) => handleItem("remove", { itemId, colorId, type, userId });

  const clearError = () => setError(null);

  return { addNewItem, removeItem, clearError, error, loading };
};
