import { FC, useRef, useState } from "react";

interface Props {
  options: Object[] | string[];
  value: any;
  placeholder?: string;
  onChange: (value: any) => void;
  labelFormatter?: (value: any) => string;
  valueFormatter?: (value: any) => string | number;
}

const Select: FC<Props> = ({
  options,
  value,
  placeholder = "Select an option",
  onChange,
  labelFormatter,
  valueFormatter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const noValue =
    !value || (typeof value === "object" && Object.keys(value).length === 0);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (selectedValue: string | number | Object) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!selectRef.current?.contains(e.relatedTarget)) {
      setTimeout(() => setIsOpen(false), 200);
    }
  };

  return (
    <div
      ref={selectRef}
      className="relative inline-block w-full "
      tabIndex={0}
      onBlur={handleBlur}
    >
      <input
        type="hidden"
        name="itemColor"
        value={
          typeof valueFormatter === "function"
            ? valueFormatter(value) ?? ""
            : value ?? ""
        }
      />
      <div
        onClick={toggleDropdown}
        className="w-full p-2 text-mediumBeige border-2 border-mediumBeige rounded-xl cursor-pointer flex justify-between items-center"
      >
        <span className={noValue ? "text-greyBeige" : "text-darkBeige"}>
          {value
            ? typeof labelFormatter === "function"
              ? labelFormatter(value) ?? placeholder
              : value
            : placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isOpen && options.length > 0 && (
        <ul className="absolute w-full max-h-40 overflow-y-auto text-darkBeige bg-lightBeige border border-gray-300 rounded-lg shadow-sm z-20">
          {options.map((item: any) => {
            return (
              <li
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                className="p-2 cursor-pointer hover:bg-gray-200"
              >
                {typeof labelFormatter === "function"
                  ? labelFormatter(item)
                  : item}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
