import React, { useEffect, useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { Color } from "../types";
import { addItem, fetchItems } from "../api";
import { useColors } from "../contexts/ColorsProvider";
import { useAuth } from "../contexts/AuthProvider";

interface Item {
  color: number;
  name: string;
  id: number;
}

const WishList: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const colors = useColors();
  const { user } = useAuth();

  const getColor = (color: number) =>
    colors.find((c: Color) => c.id === color)?.color; // todo make it nicer and make reusable

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

  // todo
  const handleRemove = (itemId: number) => {
    const newItems = items.filter((item) => item.id !== itemId);
    setItems(newItems);
  };

  return (
    <>
      <div className="pb-4">
        {items.map((item) => (
          <Item
            key={item.name + item.color}
            id={item.id}
            color={{ id: item.color, color: getColor(item.color) ?? "white" }}
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
