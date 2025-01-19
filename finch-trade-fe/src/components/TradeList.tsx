import React, { useEffect, useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { useColors } from "../contexts/ColorsProvider";
import { addItem, fetchItems, removeItem } from "../api";
import { useAuth } from "../contexts/AuthProvider";
import { getColorName } from "../utils";
import { Item as ItemType } from "../types";

// todo wishlist and tradelist can be one component distinguished by a prop
const TradeList: React.FC = () => {
  const [items, setItems] = useState<ItemType[]>([]);
  const colors = useColors();
  const { user } = useAuth();

  const getItems = async () => {
    try {
      const response = await fetchItems("tradelist");
      setItems(response);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    getItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("itemName") as string;
    const itemColor = Number(formData.get("itemColor"));

    if (itemName && itemColor) {
      await addItem({
        //id: null,
        name: itemName,
        color: itemColor,
        userId: user.id,
        listType: "tradelist",
      });
    }
    await getItems();
  };

  const handleRemove = async (itemId: number, colorId: number) => {
    await removeItem(itemId, colorId, "tradelist");
    await getItems();
  };

  return (
    <>
      <div className="pb-4">
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
      <ItemAdd handleSubmit={handleSubmit} colors={colors} />
    </>
  );
};

export default TradeList;
