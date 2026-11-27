import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AutocompleteSelect from '../../shared/components/AutocompleteSelect';
import Select from '../../shared/components/Select';
import Card from '../../shared/components/Card';
import IconButton from '../../shared/components/IconButton';
import InlineAlert from '../../shared/components/InlineAlert';
import { Color, Item, ListType, UserItems } from '../../shared/types';
import { fetchItemColors } from '../../api/api';
import { MAX_ITEM_NAME_LENGTH } from '../../../../shared/src/constants/limits.js';

interface Props {
  items: Item[];
  colors: Color[];
  userItems: UserItems;
  type: ListType;
  isAdding: boolean;
  isCatalogLoading: boolean;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  clearError: () => void;
}

const ItemAdd: FC<Props> = ({
  items,
  colors,
  userItems,
  type,
  isAdding,
  isCatalogLoading,
  handleSubmit,
  clearError,
}) => {
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const [filteredOptions, setFilteredOptions] = useState<Item[]>(items);
  const [nameValue, setNameValue] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item>();
  const [selectedColor, setSelectedColor] = useState<Color>();
  const itemColorsQuery = useQuery({
    queryKey: ['catalog', 'item-colors', selectedItem?.id],
    queryFn: () => {
      if (!selectedItem) throw new Error('No catalog item is selected.');
      return fetchItemColors(selectedItem.id);
    },
    enabled: selectedItem !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    setFilteredOptions(items);
  }, [items]);

  const isValidItemName = (name: string): boolean => {
    return name.trim().length > 0 && name.trim().length <= MAX_ITEM_NAME_LENGTH;
  };

  const disabled =
    isAdding ||
    isCatalogLoading ||
    (selectedItem !== undefined && itemColorsQuery.isFetching) ||
    itemColorsQuery.isError ||
    !selectedColor ||
    !nameValue ||
    !isValidItemName(nameValue);
  const itemsWithAnyColor = new Set(
    [...userItems.wishlist, ...userItems.tradelist]
      .filter((item) => item.color === 1)
      .map((item) => item.item_id),
  );
  const availableItems = (options: Item[]) =>
    options.filter((item) => !itemsWithAnyColor.has(item.id));
  const usedColorIds = new Set(
    [...userItems.wishlist, ...userItems.tradelist]
      .filter((item) => item.item_id === selectedItem?.id)
      .map((item) => item.color),
  );
  const itemColors = selectedItem ? (itemColorsQuery.data ?? []) : colors;
  const filteredColors = itemColors.filter(
    (color: Color) =>
      (type === 'wishlist' || color.color !== 'any') &&
      !usedColorIds.has(color.id),
  );

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    const value = e.target.value;
    // Prevent input that exceeds max length
    if (value.length > MAX_ITEM_NAME_LENGTH) return;

    setNameValue(value);
    setSelectedItem(undefined);
    setSelectedColor(undefined);
    if (value.trim()) {
      setFilteredOptions(
        items.filter((item) =>
          item.name.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    } else {
      setFilteredOptions(availableItems(items));
    }
  };

  const handleItemOptionClick = (item: Item) => {
    clearError();
    setNameValue(item.name);
    setSelectedItem(item);
    setSelectedColor(undefined);
  };

  const handleColorChange = (color: Color) => {
    clearError();
    setSelectedColor(color);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    clearError();
    e.preventDefault();
    if (!selectedColor || !isValidItemName(nameValue)) return;
    if (!(await handleSubmit(e))) return;

    setNameValue('');
    setSelectedItem(undefined);
    setSelectedColor(undefined);
    setFilteredOptions(items);
    itemNameInputRef.current?.focus();
  };

  return (
    <>
      <Card>
        <form
          onSubmit={handleFormSubmit}
          className="relative w-full h-auto flex items-stretch space-x-4"
          autoComplete="off"
        >
          <AutocompleteSelect
            id="itemName"
            options={availableItems(filteredOptions)}
            value={nameValue}
            placeholder="Item name"
            inputRef={itemNameInputRef}
            autoFocus
            onInputChange={handleItemInputChange}
            onChange={handleItemOptionClick}
          />
          <Select
            id="itemColor"
            options={filteredColors}
            value={selectedColor}
            placeholder="Color"
            loading={selectedItem !== undefined && itemColorsQuery.isFetching}
            onChange={handleColorChange}
            labelFormatter={(color: Color) => color?.color}
          />
          <IconButton
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            }
            loading={isAdding || isCatalogLoading}
            loadingLabel={isAdding ? 'Adding item' : 'Loading item catalog'}
            disabled={disabled}
            buttonProps={{
              'aria-label': isAdding ? 'Adding item' : 'Confirm',
              type: 'submit',
            }}
            size="h-10 w-10"
          />
        </form>
      </Card>
      {itemColorsQuery.isError && (
        <div className="my-2">
          <InlineAlert
            type="error"
            message="Could not load colors for this item."
            action={{
              label: 'Retry',
              onClick: () => itemColorsQuery.refetch().then(() => undefined),
            }}
          />
        </div>
      )}
    </>
  );
};

export default ItemAdd;
