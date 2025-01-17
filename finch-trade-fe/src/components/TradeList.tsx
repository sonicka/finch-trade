import React, { useState } from "react";
import Item from "./Item";
import ItemAdd from "./ItemAdd";
import { Color } from "../types";

interface Props {
  colors: Color[];
}

interface Item {
  color: string;
  name: string;
  id: string;
}

// todo
const dummyItems: Item[] = [
  { color: "red", name: "T-shirt", id: "T-shirtred" },
];

const TradeList: React.FC<Props> = ({ colors }) => {
  const [items, setItems] = useState<Item[]>(dummyItems);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get("itemName") as string;
    const itemColor = formData.get("itemColor") as string;

    if (itemName && itemColor) {
      setItems([
        ...items,
        { name: itemName, color: itemColor, id: itemName + itemColor },
      ]);
    }
  };

  const handleRemove = (itemId: string) => {
    const newItems = items.filter((item) => item.id !== itemId);
    setItems(newItems);
  };

  return (
    <>
      <div className="pb-4">
        {items.map((item) => (
          <Item
            key={item.name + item.color}
            id={item.name + item.color}
            color={item.color}
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
