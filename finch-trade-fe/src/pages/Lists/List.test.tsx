import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import List from './List';
import { ListTypeEnum } from '../../shared/types';

const mocks = vi.hoisted(() => ({
  useItems: vi.fn(),
  useColors: vi.fn(),
  useUserItems: vi.fn(),
  useUserData: vi.fn(),
  useManageItem: vi.fn(),
  removeItem: vi.fn(),
  addNewItem: vi.fn(),
  clearMessage: vi.fn(),
}));

vi.mock('../../shared/context/DataProvider', () => ({
  useItems: mocks.useItems,
  useColors: mocks.useColors,
}));

vi.mock('../../shared/context/UserProvider', () => ({
  useUserItems: mocks.useUserItems,
  useUserData: mocks.useUserData,
}));

vi.mock('../../shared/hooks/items', () => ({
  useManageItem: mocks.useManageItem,
}));

vi.mock('../../shared/components/Alert', () => ({
  default: () => null,
}));

const items = [{ id: 1, name: 'Leaf' }];
const colors = [
  { id: 1, color: 'any' },
  { id: 4, color: 'white' },
];
const leaf = { user_id: 1, item_id: 1, color: 4, name: 'Leaf' };

const renderList = () => render(<List type={ListTypeEnum.Wishlist} />);

const selectLeaf = () => {
  fireEvent.change(screen.getByLabelText('Item name'), {
    target: { value: 'Leaf' },
  });
  fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
  fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
};

describe('List item removal integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useItems.mockReturnValue([items, vi.fn()]);
    mocks.useColors.mockReturnValue(colors);
    mocks.useUserData.mockReturnValue({
      userItems: { wishlist: [leaf], tradelist: [] },
    });
    mocks.useUserItems.mockReturnValue([[leaf], vi.fn()]);
    mocks.useManageItem.mockReturnValue({
      addNewItem: mocks.addNewItem,
      removeItem: mocks.removeItem,
      error: null,
      successes: [],
      clearMessage: mocks.clearMessage,
    });
    mocks.removeItem.mockResolvedValue(undefined);
  });

  it('removes an item through the X button and makes its color available again', () => {
    const { rerender } = renderList();

    selectLeaf();
    expect(
      screen.queryByRole('option', { name: 'white' }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(mocks.removeItem).toHaveBeenCalledWith(1, 4, 'wishlist');

    mocks.useUserData.mockReturnValue({
      userItems: { wishlist: [], tradelist: [] },
    });
    mocks.useUserItems.mockReturnValue([[], vi.fn()]);
    rerender(<List type={ListTypeEnum.Wishlist} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    expect(screen.getByRole('option', { name: 'white' })).toBeInTheDocument();
  });
});
