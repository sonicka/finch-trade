import { Ref, useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';

interface Props<T extends { id: string | number; name: string }> {
  id: string;
  options: T[];
  value: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement, Element>) => void;
  onChange: (item: T) => void;
}

const AutocompleteSelect = <T extends { id: string | number; name: string }>({
  id,
  options,
  value,
  placeholder = 'Select an option',
  inputRef,
  autoFocus = false,
  onInputChange,
  onChange,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (typeof onInputChange === 'function') onInputChange(e);
  };

  const handleSelect = (item: T) => {
    onChange(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        options.length === 0 ? -1 : (currentIndex + 1) % options.length,
      );
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((currentIndex) =>
        options.length === 0
          ? -1
          : currentIndex <= 0
            ? options.length - 1
            : currentIndex - 1,
      );
    }

    if (e.key === 'Enter' && isOpen && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(options[highlightedIndex]);
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Anchor asChild>
        <div className="relative inline-block w-full">
          <input
            ref={(element) => {
              if (typeof inputRef === 'function') {
                inputRef(element);
              } else if (inputRef) {
                inputRef.current = element;
              }
            }}
            name={id}
            id={id}
            type="text"
            tabIndex={0}
            autoFocus={autoFocus}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={`${id}-listbox`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${id}-option-${options[highlightedIndex]?.id}`
                : undefined
            }
            placeholder=" "
            className="peer w-full p-2 text-darkBeige bg-lightBeige border-2 border-mediumBeige rounded-xl
                   focus:outline-2 focus:outline-offset-1 focus:outline-darkBeige focus:border-darkBeige placeholder-transparent transition-all"
          />
          <label
            htmlFor={id}
            className="absolute left-3 top-2.5 px-1 text-mediumBeige transition-all cursor-text bg-lightBeige
               peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-darkBeige
               peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-xs"
          >
            {placeholder}
          </label>
        </div>
      </Popover.Anchor>

      {options.length > 0 && (
        <Popover.Portal>
          <Popover.Content
            id={`${id}-listbox`}
            role="listbox"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            onInteractOutside={(event) => {
              if (event.target instanceof HTMLInputElement) {
                event.preventDefault();
              }
            }}
            className="z-20 w-[var(--radix-popper-anchor-width)] max-h-40 overflow-y-auto text-darkBeige bg-lightBeige border border-gray-300 rounded-lg shadow-sm"
          >
            <div>
              {options.map((item: T, index) => (
                <button
                  type="button"
                  tabIndex={-1}
                  key={item.id}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  id={`${id}-option-${item.id}`}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={`block w-full p-2 text-left cursor-pointer outline-none focus:outline-2 focus:outline-offset-[-1px] focus:outline-darkBeige ${
                    highlightedIndex === index
                      ? 'bg-beige text-darkBeige'
                      : 'hover:bg-gray-200'
                  }`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(item)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
};

export default AutocompleteSelect;
