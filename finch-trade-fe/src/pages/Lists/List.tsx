import React, { FormEvent } from 'react';
import Item from './Item';
import ItemAdd from './ItemAdd';
import {
  useCatalogStatus,
  useColors,
  useItems,
} from '../../shared/context/DataProvider';
import { useUserItems } from '../../shared/context/UserProvider';
import { useManageItem } from '../../shared/hooks/items';
import { getColorName } from '../../shared/utils';
import { ListType, UserItem } from '../../shared/types';
import Alert from '../../shared/components/Alert';
import InlineAlert from '../../shared/components/InlineAlert';
import Spinner from '../../shared/components/Spinner';

interface Props {
  type: ListType;
}

const maxHeight = `calc(100vh - ${147 + 66 + 99 + 93 + 32}px)`;

const List: React.FC<Props> = ({ type }) => {
  const [allItems] = useItems();
  const wishlistQuery = useUserItems('wishlist');
  const tradelistQuery = useUserItems('tradelist');
  const { data: wishlist = [] } = wishlistQuery;
  const { data: tradelist = [] } = tradelistQuery;
  const allUserItems = { wishlist, tradelist };
  const userItems = allUserItems[type];
  const {
    addNewItem,
    removeItem,
    error,
    successes,
    clearMessage,
    isAdding,
    removingItem,
  } = useManageItem();
  const colors = useColors();
  const catalogStatus = useCatalogStatus();
  const userItemsLoading = wishlistQuery.isPending || tradelistQuery.isPending;
  const userItemsError = wishlistQuery.isError || tradelistQuery.isError;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const itemName = formData.get('itemName');
    const itemColor = Number(formData.get('itemColor'));
    if (typeof itemName !== 'string' || !itemName || !itemColor) return false;
    return addNewItem(itemName, itemColor, type);
  };

  const handleRemove = async (
    itemId: number,
    name: string,
    colorId: number,
  ): Promise<void> => {
    await removeItem(itemId, name, colorId, type);
  };

  return (
    <>
      <div className="relative">
        <ItemAdd
          handleSubmit={handleSubmit}
          items={allItems}
          colors={colors}
          userItems={allUserItems}
          type={type}
          isAdding={isAdding}
          isCatalogLoading={catalogStatus.isLoading}
          clearError={clearMessage}
        />
      </div>
      {catalogStatus.error && (
        <div className="my-2">
          <InlineAlert
            type="error"
            message={catalogStatus.error}
            action={{
              label: 'Retry loading catalog',
              onClick: catalogStatus.retry,
            }}
          />
        </div>
      )}
      {userItemsError && (
        <div className="my-2">
          <InlineAlert
            type="error"
            message="Could not load your items. Please try again."
            action={{
              label: 'Retry loading items',
              onClick: () =>
                Promise.all([
                  wishlistQuery.refetch(),
                  tradelistQuery.refetch(),
                ]).then(() => undefined),
            }}
          />
        </div>
      )}
      {userItemsLoading && (
        <div
          className="flex items-center justify-center gap-2 py-6"
          role="status"
        >
          <Spinner size={40} label="Loading your items" />
        </div>
      )}
      <div
        className="overflow-y-auto scrollbar scrollbar-thumb-darkBeige scrollbar-track-beige"
        style={{ maxHeight }}
      >
        <div className="pt-6">
          <div className="absolute -mt-6 -pt-8 w-full inset-x-0 h-6 bg-gradient-to-b from-beige via-transparent to-transparent to-80% z-10" />
          {successes.map(({ id, message, undo }) => (
            <Alert
              key={id}
              type="success"
              message={message}
              autoHide
              action={
                undo
                  ? {
                      label: 'Undo',
                      onClick: () =>
                        addNewItem(undo.name, undo.colorId, undo.type),
                    }
                  : undefined
              }
            />
          ))}
          {error && <Alert type="error" message={error} />}
          {userItems?.map((item: UserItem) => (
            <div className="mb-3" key={item.item_id + '' + item.color}>
              <Item
                key={item.name + item.color}
                itemId={item.item_id}
                color={{
                  id: item.color,
                  color: getColorName(colors, item.color),
                }}
                text={item.name}
                isInTrade={item.isInTrade}
                isRemoving={
                  removingItem?.itemId === item.item_id &&
                  removingItem?.colorId === item.color
                }
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
