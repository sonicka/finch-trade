import { Color, Item, RequestedTrade, TradeItem } from "./types";

export const getColorName = (colors: Color[], color: number) =>
  colors.find((c: Color) => c.id === color)?.color ?? "any";

export const getItemName = (items: Item[], id: number) =>
  items.find((i: Item) => i.id === id)?.name;

export const filterRequestedItems = (
  allItems: TradeItem[],
  requestedTrade?: RequestedTrade
) => {
  if (!requestedTrade) return allItems;
  const { itemId1, itemId2, colorId1, colorId2 } = requestedTrade;
  return allItems.filter(
    (i) =>
      (i.itemId === itemId1 && i.colorId === colorId1) ||
      (i.itemId === itemId2 && i.colorId === colorId2)
  );
};

export const formatDate = (date: string | Date) => {
  let d = date;
  if (typeof d === "string") d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(/\b(am|pm)\b/, (match) => match.toUpperCase());
};
