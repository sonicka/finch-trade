import * as SelectPrimitive from '@radix-ui/react-select';
import { useState } from 'react';

interface Props<T extends { id: number }> {
  id: string;
  options: T[];
  value?: T;
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
  const noValue =
    !value || (typeof value === 'object' && Object.keys(value).length === 0);
  const selectedLabel =
    !noValue && typeof labelFormatter === 'function'
      ? labelFormatter(value)
      : value?.toString();

  return (
    <div className="relative inline-block w-full">
      <SelectPrimitive.Root
        value={value ? value.id.toString() : ''}
        onValueChange={(selectedId) => {
          const selectedValue = options.find(
            (option) => option.id.toString() === selectedId,
          );
          if (selectedValue) onChange(selectedValue);
        }}
        onOpenChange={setIsOpen}
      >
        <input
          type="hidden"
          name={id}
          value={
            (typeof valueFormatter === 'function' && value
              ? valueFormatter(value)
              : value?.toString()) ?? ''
          }
        />
        <label
          htmlFor={id}
          className={`absolute left-3 px-1 transition-all cursor-pointer bg-lightBeige z-10
      ${
        isOpen || !noValue
          ? '-top-2.5 left-2 text-xs text-darkBeige'
          : 'top-2.5 text-base text-mediumBeige'
      }`}
        >
          {placeholder}
        </label>
        <SelectPrimitive.Trigger
          id={id}
          tabIndex={0}
          className={`w-full border-2 rounded-xl cursor-pointer flex justify-between items-center transition-all p-2 text-darkBeige
                   bg-transparent text-left outline-none focus:ring-2 focus:ring-darkBeige focus:ring-offset-1
                   ${isOpen ? 'border-darkBeige' : 'border-mediumBeige'}`}
        >
          <SelectPrimitive.Value placeholder={'\u00a0'}>
            <span className={`${!noValue && 'text-darkBeige'}`}>
              {selectedLabel}
            </span>
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon>
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
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        {options.length > 0 && (
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={4}
              className="z-20 min-w-[var(--radix-select-trigger-width)] max-h-40 overflow-y-auto text-darkBeige bg-lightBeige rounded-lg shadow-sm"
            >
              <SelectPrimitive.Viewport>
                {options.map((item: T) => (
                  <SelectPrimitive.Item
                    key={item.id}
                    value={item.id.toString()}
                    className="p-2 cursor-pointer hover:bg-gray-200 data-[highlighted]:bg-beige data-[highlighted]:text-darkBeige outline-none"
                  >
                    <SelectPrimitive.ItemText>
                      {typeof labelFormatter === 'function'
                        ? labelFormatter(item)
                        : item.toString()}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        )}
      </SelectPrimitive.Root>
    </div>
  );
};

export default Select;
