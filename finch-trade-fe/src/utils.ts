import { Color, Item } from "./types";

export const getColorName = (colors: Color[], color: number) =>
  colors.find((c: Color) => c.id === color)?.color ?? "any";

export const getItemName = (items: Item[], id: number) =>
  items.find((i: Item) => i.id === id)?.name;
