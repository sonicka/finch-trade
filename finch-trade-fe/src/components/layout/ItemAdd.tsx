import { FC, SubmitEventHandler, useState } from 'react';
import Select from '../ui/Select';
import Card from '../ui/Card';
import AutocompleteSelect from '../ui/AutocompleteSelect';
import IconButton from '../ui/IconButton';
import { Item, Color, ListType } from '../../types';

interface Props {
  items: Item[];
  colors: Color[];
  type: ListType;
  handleSubmit: SubmitEventHandler<HTMLFormElement>;
  clearError: () => void;
}

const ItemAdd: FC<Props> = ({
  items,
  colors,
  type,
  handleSubmit,
  clearError,
}) => {
  const [filteredOptions, setFilteredOptions] = useState<Item[]>([]);
  const [nameValue, setNameValue] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<Color>();
  const disabled = !selectedColor || !nameValue;
  const filteredColors = colors.filter((color: Color) => {
    if (type === 'wishlist' || color.color !== 'any') return color;
  }); // remove 'any' option from tradelist

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    const value = e.target.value;
    setNameValue(value);
    if (value) {
      setFilteredOptions(
        items.filter((item) =>
          item.name.toLowerCase().includes(value.toLowerCase()),
        ),
      );
    } else {
      setFilteredOptions([]);
    }
  };

  const handleItemOptionClick = (item: Item) => {
    clearError();
    setNameValue(item.name);
  };

  const handleColorChange = (color: Color) => {
    clearError();
    setSelectedColor(color);
  };

  return (
    <Card>
      <form
        onSubmit={handleSubmit}
        className="relative w-full h-auto flex items-stretch space-x-4"
        autoComplete="off"
      >
        <AutocompleteSelect
          id="itemName"
          options={filteredOptions}
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
