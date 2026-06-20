import { useState } from 'react';

interface Props<T extends { id: string | number; name: string }> {
  id: string;
  options: T[];
  value: string;
  placeholder?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
  onChange: (item: T) => void;
}

const AutocompleteSelect = <T extends { id: string | number; name: string }>({
  id,
  options,
  value,
  placeholder = 'Select an option',
  onInputChange,
  onChange,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(true);
    if (typeof onInputChange === 'function') onInputChange(e);
  };

  const handleSelect = (selectedValue: T) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block w-full">
      <input
        name={id}
        id={id}
        value={value}
        onClick={toggleDropdown}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder=" "
        className="peer w-full p-2 text-darkBeige bg-lightBeige border-2 border-mediumBeige rounded-xl
               focus:outline-none focus:border-darkBeige placeholder-transparent transition-all"
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-2.5 px-1 text-mediumBeige transition-all cursor-text bg-lightBeige
               peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-darkBeige
               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {placeholder}
      </label>

      {isOpen && options.length > 0 && (
        <ul className="absolute w-full max-h-40 overflow-y-auto text-darkBeige bg-lightBeige border border-gray-300 rounded-lg shadow-sm z-20">
          {options.map((item: T) => (
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
