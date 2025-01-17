import React, { useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { useColors } from "../contexts/ColorsProvider";
import { addItem } from "../api";
import { useAuth } from "../contexts/AuthProvider";
import { Color } from "../types";

interface Item {
  color: number;
  name: string;
  id: number;
}

// todo
const dummyItems: Item[] = [{ color: 1, name: "T-shirt", id: 666 }];

const TradeList: React.FC = () => {
  const [items, setItems] = useState<Item[]>(dummyItems);
  const colors = useColors();
  const { user } = useAuth();

  const getColor = (color: number) =>
    colors.find((c: Color) => c.id === color)?.color; // todo make it nicer and make reusable

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("itemName") as string;
    const itemColor = Number(formData.get("itemColor"));

    if (itemName && itemColor) {
      setItems([...items, { name: itemName, color: itemColor, id: 666 }]);

      await addItem({
        //id: null,
        name: itemName,
        color: itemColor,
        userId: user.id,
        listType: "tradelist",
      });
    }
  };

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

export default TradeList;
