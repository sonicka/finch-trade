import { createContext, useState, useEffect, useContext, JSX } from "react";
import { Color } from "../types";
import { fetchColors } from "../api";

interface Props {
  children: JSX.Element;
}

const ColorsContext = createContext<Color[]>([]);

export const useColors = () => useContext(ColorsContext);

export const ColorsProvider = ({ children }: Props) => {
  const [colors, setColors] = useState<Color[]>([]);

  useEffect(() => {
    const getColors = async () => {
      try {
        const response = await fetchColors();
        setColors(response);
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };

    getColors();
  }, []);

  return (
    <ColorsContext.Provider value={colors}>{children}</ColorsContext.Provider>
  );
};
