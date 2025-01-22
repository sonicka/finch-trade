import { createContext, useState, useEffect, useContext, JSX } from "react";
import { fetchAllItems } from "../api";
import { Item } from "../types";

interface Props {
  children: JSX.Element;
}

const ItemsContext = createContext<Item[]>([]);

export const useItems = () => useContext(ItemsContext);

export const ItemsProvider = ({ children }: Props) => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const getItems = async () => {
      try {
        const response = await fetchAllItems();
        setItems(response);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    getItems();
  }, []);

  return (
    <ItemsContext.Provider value={items}>{children}</ItemsContext.Provider>
  );
};
