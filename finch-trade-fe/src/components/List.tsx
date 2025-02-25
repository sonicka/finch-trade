import React, { useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { addItem, removeItem } from "../api/api";
import { useColors, useItems } from "../context/DataProvider";
import { useUser, useUserItems } from "../context/UserProvider";
import { getColorName } from "../utils";
import { ListType } from "../types";
import Alert from "./Alert";

interface Props {
  type: ListType;
}

const maxHeight = `calc(100vh - ${128 + 74 + 76 + 64 + 32}px)`;

const List: React.FC<Props> = ({ type }: Props) => {
  const [error, setError] = useState<string>("");
  const [allItems, getAllItems] = useItems();
  const [userItems, getUserItems] = useUserItems(type);
  const colors = useColors();
  const user = useUser();

  console.log("userItems", userItems);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("itemName") as string;
    const itemColor = Number(formData.get("itemColor"));

    if (itemName && itemColor && user?.id) {
      try {
        // todo custom hook?
        setError("");
        await addItem({
          name: itemName,
          color: itemColor,
          userId: user?.id,
          listType: type,
        });
        await getUserItems(type);
        await getAllItems();
      } catch (e: any) {
        setError(e?.message);
      }
    }
  };

  const handleRemove = async (itemId: number, colorId: number) => {
    if (user) {
      await removeItem(itemId, colorId, type, user?.id);
      await getUserItems(type);
    }
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
        {userItems.map((item) => (
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
