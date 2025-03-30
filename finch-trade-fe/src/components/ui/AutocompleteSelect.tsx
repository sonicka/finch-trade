import { FC, useState } from "react";

interface Props {
  options: Object[] | string[];
  value: any;
  placeholder?: string;
  onInputChange?: (value: any) => void;
  onChange: (value: any) => void;
}

const AutocompleteSelect: FC<Props> = ({
  options,
  value,
  placeholder = "Select an option",
  onInputChange,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(true);
    if (typeof onInputChange === "function") onInputChange(e);
  };

  const handleSelect = (selectedValue: string | number | Object) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full">
      <input
        name="itemName"
        value={value}
        onClick={toggleDropdown}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="w-full p-2 text-darkBeige bg-lightBeige border-2 border-mediumBeige rounded-xl focus:outline-none focus:ring-1 focus:ring-mediumBeige placeholder-greyBeige"
      />

      {isOpen && options.length > 0 && (
        <ul className="absolute w-full max-h-40 overflow-y-auto text-darkBeige bg-lightBeige border border-gray-300 rounded-lg shadow-sm z-20">
          {options.map((item: any) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="p-2 cursor-pointer hover:bg-gray-200"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteSelect;
