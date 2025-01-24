import { FC } from "react";
import { Color } from "../types";
import { getColorName } from "../utils";

interface Props {
  colors: Color[];
  colorId: number;
}

const ColorCircle: FC<Props> = ({ colors, colorId }: Props) => {
  if (colorId === 1) {
    return (
      <div className="w-6 h-6 rounded-full object-cover border border-black bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
    );
  } else {
    return (
      <div
        className="w-6 h-6 ml-2 mr-2 rounded-full object-cover border border-black"
        style={{
          backgroundColor:
            colorId === 1
              ? "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
              : getColorName(colors, colorId),
        }}
      />
    );
  }
};

export default ColorCircle;
