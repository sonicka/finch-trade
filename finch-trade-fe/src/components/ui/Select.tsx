import { useRef, useState } from 'react';

interface Props<T extends { id: number }> {
  id: string;
  options: T[];
  value: T;
  placeholder?: string;
  onChange: (value: T) => void;
  labelFormatter?: (value: T) => string;
  valueFormatter?: (value: T) => string;
}

const Select = <T extends { id: number }>({
  id,
  options,
  value,
  placeholder = 'Select an option',
  onChange,
  labelFormatter,
  valueFormatter,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const noValue =
    !value || (typeof value === 'object' && Object.keys(value).length === 0);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (selectedValue: string | number | object) => {
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
        name={id}
        value={
          typeof valueFormatter === 'function'
            ? (valueFormatter(value) ?? '')
            : (value ?? '')
        }
      />
      <label
        className={`absolute left-3 px-1 transition-all cursor-pointer bg-lightBeige z-10
      ${
        isOpen || !noValue
          ? '-top-2.5 left-2 text-xs text-darkBeige'
          : 'top-2.5 text-base text-mediumBeige'
      }`}
        onClick={toggleDropdown}
      >
        {placeholder}
      </label>
      <div
        onClick={toggleDropdown}
        className={`w-full border-2 rounded-xl cursor-pointer flex justify-between items-center transition-all p-2 text-darkBeige
                   ${isOpen ? 'border-darkBeige' : 'border-mediumBeige'}`}
      >
        <span className={`${!noValue && 'text-darkBeige'}`}>
          {!noValue ? (
            typeof labelFormatter === 'function' ? (
              labelFormatter(value)
            ) : (
              <>{value}</>
            )
          ) : (
            <>&nbsp;</>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
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
          {options.map((item: T) => {
            return (
              <li
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                className="p-2 cursor-pointer hover:bg-gray-200"
              >
                <>
                  {typeof labelFormatter === 'function'
                    ? labelFormatter(item)
                    : item}
                </>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Select;
