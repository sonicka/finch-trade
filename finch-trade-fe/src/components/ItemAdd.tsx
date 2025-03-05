import { FC, FormEventHandler, useState } from "react";
import { Color, Item, ListType } from "../types";

interface Props {
  items: Item[];
  colors: Color[];
  type: ListType;
  handleSubmit: FormEventHandler<HTMLFormElement>;
  clearError: Function;
}

const ItemAdd: FC<Props> = ({
  items,
  colors,
  type,
  handleSubmit,
  clearError,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Item[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const disabled = !selectedColor || !inputValue;
  const filteredColors = colors.filter((color: Color) => {
    if (type === "wishlist" || color.color !== "any") return color;
  }); // remove 'any' option from tradelist

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    const value = e.target.value;
    setInputValue(value);
    if (value) {
      setFilteredOptions(
        items.filter((item) =>
          item.name.toLowerCase().includes(value.toLowerCase())
        )
      );
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleOptionClick = (item: Item) => {
    clearError();
    setInputValue(item.name);
    setShowDropdown(false);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    clearError();
    setSelectedColor(e.target.value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex space-x-4 p-4 border rounded-lg"
      autoComplete="off"
    >
      <div className="w-full relative">
        <input
          name="itemName"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Item name"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showDropdown && filteredOptions.length > 0 && (
          <ul className="absolute w-full max-h-40 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md z-10">
            {filteredOptions.map((item: Item) => (
              <li
                key={item.id}
                onClick={() => handleOptionClick(item)}
                className="p-2 cursor-pointer hover:bg-gray-200"
              >
                {item.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="w-full flex gap-4">
        <select
          name="itemColor"
          className="flex-1 max-h-40 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedColor}
          onChange={handleColorChange}
        >
          <option value="" disabled>
            Select color
          </option>
          {filteredColors.map((color: Color) => (
            <option key={color.id} value={color.id}>
              {color.color}
            </option>
          ))}
        </select>
        <button
          className={`w-10 h-10 p-2 text-white rounded-full ${
            disabled
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-400 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
          }`}
          aria-label="Confirm"
          type="submit"
          disabled={disabled}
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
      </div>
    </form>
  );
};

export default ItemAdd;
