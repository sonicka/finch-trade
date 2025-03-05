import { FC } from "react";
import { Color } from "../types";

interface Props {
  color: Color;
  text: string;
  itemId: number;
  handleRemove: Function;
}

const Item: FC<Props> = ({ color, text, itemId, handleRemove }) => {
  return (
    <div className="flex justify-between p-4 border rounded-lg mb-2">
      <div className="flex gap-4">
        {color.id === 1 ? (
          <div className="w-6 h-6 rounded-full object-cover border border-black bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
        ) : (
          <div
            className="w-6 h-6 rounded-full object-cover border border-black"
            style={{
              backgroundColor:
                color.id === 1
                  ? "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)"
                  : color.color,
            }}
          />
        )}
        <p className={`text-${color}-500 w-auto`}>{text}</p>
      </div>
      <button
        className="p-0.5 bg-red-400 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
        aria-label="Remove"
        type="submit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
          onClick={() => handleRemove(itemId, color.id)}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default Item;
