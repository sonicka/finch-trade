import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import List from './List';
import { ListTypeEnum } from '../../shared/types';

const mocks = vi.hoisted(() => ({
  useItems: vi.fn(),
  useColors: vi.fn(),
  useCatalogStatus: vi.fn(),
  useUserItems: vi.fn(),
  useManageItem: vi.fn(),
  removeItem: vi.fn(),
  addNewItem: vi.fn(),
  clearMessage: vi.fn(),
  successes: [] as {
    id: number;
    message: string;
    undo?: { name: string; colorId: number; type: string };
  }[],
}));

vi.mock('../../shared/context/DataProvider', () => ({
  useItems: mocks.useItems,
  useColors: mocks.useColors,
  useCatalogStatus: mocks.useCatalogStatus,
}));

vi.mock('../../shared/context/UserProvider', () => ({
  useUserItems: mocks.useUserItems,
}));

vi.mock('../../shared/hooks/items', () => ({
  useManageItem: mocks.useManageItem,
}));

vi.mock('../../shared/components/Alert', () => ({
  default: ({
    action,
    autoHide,
  }: {
    action?: { label: string; onClick: () => Promise<boolean> };
    autoHide?: boolean;
  }) =>
    action ? (
      <button data-auto-hide={autoHide} onClick={() => void action.onClick()}>
        {action.label}
      </button>
    ) : null,
}));

const items = [{ id: 1, name: 'Leaf' }];
const colors = [
  { id: 1, color: 'any' },
  { id: 4, color: 'white' },
];
const leaf = {
  user_id: 1,
  item_id: 1,
  color: 4,
  name: 'Leaf',
  isInTrade: false,
};

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
    mocks.successes = [];
    mocks.useItems.mockReturnValue([items, vi.fn()]);
    mocks.useColors.mockReturnValue(colors);
    mocks.useCatalogStatus.mockReturnValue({ isLoading: false, error: null });
    mocks.useUserItems.mockImplementation((type) => ({
      data: type === 'wishlist' ? [leaf] : [],
    }));
    mocks.useManageItem.mockReturnValue({
      addNewItem: mocks.addNewItem,
      removeItem: mocks.removeItem,
      error: null,
      successes: mocks.successes,
      clearMessage: mocks.clearMessage,
      removingItem: undefined,
    });
    mocks.removeItem.mockResolvedValue(undefined);
    mocks.addNewItem.mockResolvedValue(true);
  });

  it('removes an item with its name and makes its color available again', () => {
    const { rerender } = renderList();

    selectLeaf();
    expect(
      screen.queryByRole('option', { name: 'white' }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(mocks.removeItem).toHaveBeenCalledWith(1, 'Leaf', 4, 'wishlist');

    mocks.useUserItems.mockReturnValue({ data: [] });
    rerender(<List type={ListTypeEnum.Wishlist} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    expect(screen.getByRole('option', { name: 'white' })).toBeInTheDocument();
  });

  it('shows a spinner in place of the remove button for the item being deleted', () => {
    mocks.useManageItem.mockReturnValue({
      addNewItem: mocks.addNewItem,
      removeItem: mocks.removeItem,
      error: null,
      successes: mocks.successes,
      clearMessage: mocks.clearMessage,
      removingItem: { itemId: 1, colorId: 4 },
    });

    renderList();

    expect(
      screen.getByRole('button', { name: 'Removing item' }),
    ).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Removing item' })).toBeVisible();
  });

  it('restores a removed item using its success alert action', () => {
    mocks.successes.push({
      id: 1,
      message: 'Item removed',
      undo: { name: 'Leaf', colorId: 4, type: 'wishlist' },
    });
    renderList();

    const undoButton = screen.getByRole('button', { name: 'Undo' });
    fireEvent.click(undoButton);

    expect(mocks.addNewItem).toHaveBeenCalledWith('Leaf', 4, 'wishlist');
  });
});
