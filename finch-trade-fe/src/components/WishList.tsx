import React, { useEffect, useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { addItem, fetchItems, removeItem } from "../api";
import { useColors } from "../contexts/ColorsProvider";
import { useAuth } from "../contexts/AuthProvider";
import { getColorName } from "../utils";
import { Item as ItemType } from "../types";

const WishList: React.FC = () => {
  const [items, setItems] = useState<ItemType[]>([]);
  const colors = useColors();
  const { user } = useAuth();

  const getItems = async () => {
    try {
      const response = await fetchItems("wishlist");
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
        listType: "wishlist",
      });
    }
    await getItems();
  };

  const handleRemove = async (itemId: number, colorId: number) => {
    await removeItem(itemId, colorId, "wishlist");
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

export default WishList;
