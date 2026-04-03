import React from 'react';
import Item from './Item';
import ItemAdd from './ItemAdd';
import { useColors, useItems } from '../../context/DataProvider';
import { useUser, useUserItems } from '../../context/UserProvider';
import { useManageItem } from '../../hooks/items';
import { getColorName } from '../../utils';
import { ListType } from '../../types';
import Alert from '../ui/Alert';

interface Props {
  type: ListType;
}

const maxHeight = `calc(100vh - ${147 + 66 + 99 + 93 + 32}px)`;

const List: React.FC<Props> = ({ type }) => {
  const [allItems] = useItems();
  const [userItems] = useUserItems(type);
  const { addNewItem, removeItem, error, success, clearMessage } =
    useManageItem();
  const colors = useColors();
  const user = useUser();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get('itemName') as string;
    const itemColor = Number(formData.get('itemColor'));
    if (itemName && itemColor && user?.id) {
      await addNewItem(itemName, itemColor, type, user?.id);
    }
  };

  const handleRemove = async (
    itemId: number,
    colorId: number,
  ): Promise<void> => {
    if (user) await removeItem(itemId, colorId, type, user?.id);
  };

  return (
    <>
      <div className="relative">
        <ItemAdd
          handleSubmit={handleSubmit}
          items={allItems}
          colors={colors}
          type={type}
          clearError={clearMessage}
        />
      </div>
      <div
        className="overflow-y-auto scrollbar scrollbar-thumb-darkBeige scrollbar-track-beige"
        style={{ maxHeight }}
      >
        <div className="pt-6">
          <div className="absolute -mt-6 -pt-8 w-full inset-x-0 h-6 bg-gradient-to-b from-beige via-transparent to-transparent to-80% z-10" />
          {success && (
            <div className="pb-6">
              <Alert type="success" message={success} />
            </div>
          )}
          {error && (
            <div className="pb-6">
              <Alert type="error" message={error} />
            </div>
          )}
          {userItems?.map((item) => (
            <div className="mb-3" key={item.item_id + '' + item.color}>
              <Item
                key={item.name + item.color}
                itemId={item.item_id}
                color={{
                  id: item.color,
                  color: getColorName(colors, item.color),
                }}
                text={item.name}
                handleRemove={handleRemove}
              />
            </div>
          ))}
          <div className="absolute bottom-[101px] w-full inset-x-0 h-3 bg-gradient-to-b from-transparent via-transparent to-beige z-50"></div>
        </div>
      </div>
    </>
  );
};

export default List;
