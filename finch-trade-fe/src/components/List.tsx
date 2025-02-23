import React, { useEffect, useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { addItem, fetchAllItems, fetchUserItems, removeItem } from "../api";
import { useColors } from "../contexts/ColorsProvider";
import { useAuth } from "../contexts/AuthProvider";
import { getColorName } from "../utils";
import { Item as ItemType, ListType, UserItem } from "../types";
import Alert from "./Alert";

interface Props {
  type: ListType;
}

const maxHeight = `calc(100vh - ${128 + 74 + 76 + 64 + 32}px)`;

const List: React.FC<Props> = ({ type }: Props) => {
  const [error, setError] = useState<string>("");
  const [items, setItems] = useState<UserItem[]>([]);
  const [allItems, setAllItems] = useState<ItemType[]>([]);
  const colors = useColors();
  const { user } = useAuth();

  const getItems = async () => {
    try {
      const response = await fetchUserItems(type, user.id);
      const responseAll = await fetchAllItems();
      setAllItems(responseAll);
      setItems(response);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    getItems();
  }, [type, user.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("itemName") as string;
    const itemColor = Number(formData.get("itemColor"));

    if (itemName && itemColor) {
      try {
        setError("");
        await addItem({
          name: itemName,
          color: itemColor,
          userId: user.id,
          listType: type,
        });
      } catch (e: any) {
        setError(e?.message);
      }
    }
    await getItems();
  };

  const handleRemove = async (itemId: number, colorId: number) => {
    await removeItem(itemId, colorId, type, user?.id);
    await getItems();
  };

  return (
    <>
      <div className="pb-3">
        <div className="sticky top-32 z-10 bg-white">
          <ItemAdd
            handleSubmit={handleSubmit}
            items={allItems}
            colors={colors}
            type={type}
            clearError={() => setError("")}
          />
          {error && (
            <div className="pt-3">
              <Alert type="error" message={error} />
            </div>
          )}
        </div>
      </div>
      <div className="flex-grow pb-4 overflow-y-auto" style={{ maxHeight }}>
        {items.map((item) => (
          <Item
            key={item.name + item.color}
            itemId={item.item_id}
            color={{
              id: item.color,
              color: getColorName(colors, item.color),
            }}
            text={item.name}
            handleRemove={handleRemove}
          />
        ))}
      </div>
    </>
  );
};

export default List;
