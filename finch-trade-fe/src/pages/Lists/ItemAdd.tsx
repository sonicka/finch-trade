import { FC, SubmitEventHandler, useState } from 'react';
import Select from '../../shared/components/Select';
import Card from '../../shared/components/Card';
import AutocompleteSelect from '../../shared/components/AutocompleteSelect';
import IconButton from '../../shared/components/IconButton';
import { Item, Color, ListType, UserItems } from '../../shared/types';

interface Props {
  items: Item[];
  colors: Color[];
  userItems: UserItems;
  type: ListType;
  handleSubmit: SubmitEventHandler<HTMLFormElement>;
  clearError: () => void;
}

const ItemAdd: FC<Props> = ({
  items,
  colors,
  userItems,
  type,
  handleSubmit,
  clearError,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Item[]>(items);
  const [nameValue, setNameValue] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item>();
  const [selectedColor, setSelectedColor] = useState<Color>();
  const disabled = !selectedColor || !nameValue;
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
  const filteredColors = colors.filter(
    (color: Color) =>
      (type === 'wishlist' || color.color !== 'any') &&
      !usedColorIds.has(color.id),
  );

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    const value = e.target.value;
    setNameValue(value);
    setSelectedItem(undefined);
    setSelectedColor(undefined);
    if (value) {
      setFilteredOptions(
        items.filter((item) =>
          item.name.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    } else {
      setFilteredOptions(availableItems([]));
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

  const handleFormSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    clearError();
    e.preventDefault();
    if (selectedItem && selectedColor) {
      handleSubmit(e);
      setNameValue('');
      setSelectedItem(undefined);
      setSelectedColor(undefined);
      setFilteredOptions(items);
    }
  };

  return (
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
          onInputChange={handleItemInputChange}
          onChange={handleItemOptionClick}
        />
        <Select
          id="itemColor"
          options={filteredColors}
          value={selectedColor}
          placeholder="Color"
          onChange={handleColorChange}
          labelFormatter={(color: Color) => color?.color}
          valueFormatter={(color: Color) => color?.id.toString()}
        />
        <IconButton
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          }
          disabled={disabled}
          buttonProps={{ 'aria-label': 'Confirm', type: 'submit' }}
          size="h-10 w-10"
        />
      </form>
    </Card>
  );
};

export default ItemAdd;
