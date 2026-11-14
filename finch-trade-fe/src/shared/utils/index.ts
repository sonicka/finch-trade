import { Color, Item, RequestedTrade, TradeItem } from '../types';

export const getColorName = (colors: Color[], color: number) =>
  colors.find((c: Color) => c.id === color)?.color ?? 'any';

const baseColorNames = [
  'black',
  'brown',
  'white',
  'gray',
  'grey',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'blue',
  'green',
];

export const getColorSwatchStyle = (colorName: string) => {
  const normalizedColor = colorName.trim().toLowerCase();
  if (normalizedColor === 'any') {
    return {
      background:
        'linear-gradient(to right, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)',
    };
  }

  const baseColor = baseColorNames.find((name) =>
    new RegExp(`\\b${name}\\b`, 'i').test(normalizedColor),
  );
  if (baseColor) return { backgroundColor: baseColor };

  return {
    background:
      'linear-gradient(135deg, #d1d5db 0%, #6b7280 50%, #e5e7eb 100%)',
  };
};

export const getItemName = (items: Item[], id: number) =>
  items.find((i: Item) => i.id === id)?.name;

export const filterRequestedItems = (
  allItems: TradeItem[],
  requestedTrade?: RequestedTrade,
) => {
  if (!requestedTrade) return allItems;
  const { itemId1, itemId2, colorId1, colorId2 } = requestedTrade;
  return allItems.filter(
    (i) =>
      (i.itemId === itemId1 && i.colorId === colorId1) ||
      (i.itemId === itemId2 && i.colorId === colorId2),
  );
};

export const formatDate = (date: string | Date) => {
  let d = date;
  if (typeof d === 'string') d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(d)
    .replace(/\b(am|pm)\b/, (match) => match.toUpperCase());
};
