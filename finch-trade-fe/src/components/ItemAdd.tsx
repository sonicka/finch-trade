import { FC, FormEventHandler } from "react";
import { Color } from "../types";

interface Props {
  colors: Color[];
  handleSubmit: FormEventHandler<HTMLFormElement>;
}

const ItemAdd: FC<Props> = ({ colors, handleSubmit }: Props) => {
  return (
    <form
      onSubmit={handleSubmit}
      className="flex space-x-4 p-4 border rounded-lg"
    >
      <input
        type="text"
        name="itemName"
        placeholder="Item name"
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        name="itemColor"
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        defaultValue=""
      >
        <option value="" disabled>
          Select color
        </option>
        {colors.map((color: Color) => (
          <option key={color.id} value={color.color}>
            {color.color}
          </option>
        ))}
      </select>
      <button
        className="p-2 bg-green-400 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
        aria-label="Confirm"
        type="submit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </button>
    </form>
  );
};

export default ItemAdd;
