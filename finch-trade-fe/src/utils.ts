import { Color } from "./types";

export const getColorName = (colors: Color[], color: number) =>
  colors.find((c: Color) => c.id === color)?.color ?? "any";
