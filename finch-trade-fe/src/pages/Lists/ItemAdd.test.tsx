import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ItemAdd from './ItemAdd';
import { ListTypeEnum } from '../../shared/types';
import { MAX_ITEM_NAME_LENGTH } from '../../../../shared/src/constants/limits.js';

const items = [
  { id: 1, name: 'Leaf' },
  { id: 2, name: 'Mushroom' },
];
const colors = [
  { id: 1, color: 'any' },
  { id: 4, color: 'white' },
];

const renderItemAdd = (
  handleSubmit = vi.fn().mockResolvedValue(true),
  isAdding = false,
) =>
  render(
    <ItemAdd
      items={items}
      colors={colors}
      userItems={{ wishlist: [], tradelist: [] }}
      type={ListTypeEnum.Wishlist}
      isAdding={isAdding}
      isCatalogLoading={false}
      handleSubmit={handleSubmit}
      clearError={vi.fn()}
    />,
  );

describe('ItemAdd', () => {
  it('disables confirmation when no item or color is selected', () => {
    renderItemAdd();
    const confirm = screen.getByRole('button', { name: 'Confirm' });

    expect(confirm).toBeDisabled();
  });

  it('shows a spinner and disables confirmation while adding', () => {
    renderItemAdd(vi.fn(), true);

    expect(screen.getByRole('button', { name: 'Adding item' })).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Adding item' })).toBeVisible();
  });

  it('shows item options when the item name field is focused', () => {
    renderItemAdd();

    fireEvent.click(screen.getByLabelText('Item name'));

    expect(screen.getByRole('option', { name: 'Leaf' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Mushroom' }),
    ).toBeInTheDocument();
  });

  it('opens the color options when the field is clicked', () => {
    renderItemAdd();

    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));

    expect(screen.getByRole('option', { name: 'white' })).toBeInTheDocument();
  });

  it('enables confirmation after selecting an item and color', () => {
    renderItemAdd();
    const confirm = screen.getByRole('button', { name: 'Confirm' });

    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    fireEvent.click(screen.getByRole('option', { name: 'white' }));

    expect(confirm).toBeEnabled();
  });

  it('accepts a custom item name up to the shared length limit', () => {
    renderItemAdd();
    const itemName = 'a'.repeat(MAX_ITEM_NAME_LENGTH);

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: itemName },
    });
    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    fireEvent.click(screen.getByRole('option', { name: 'white' }));

    expect(screen.getByLabelText('Item name')).toHaveValue(itemName);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
  });

  it('rejects custom item names beyond the shared length limit', () => {
    renderItemAdd();

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'a'.repeat(MAX_ITEM_NAME_LENGTH + 1) },
    });

    expect(screen.getByLabelText('Item name')).toHaveValue('');
  });

  it('submits the selected item and color through the form', () => {
    let submittedData: FormData | undefined;
    const handleSubmit = vi.fn(async (event: SubmitEvent) => {
      event.preventDefault();
      submittedData = new FormData(event.currentTarget as HTMLFormElement);
      return true;
    });
    renderItemAdd(handleSubmit);

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    fireEvent.click(screen.getByRole('option', { name: 'white' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(handleSubmit).toHaveBeenCalledOnce();
    expect(submittedData?.get('itemName')).toBe('Leaf');
    expect(submittedData?.get('itemColor')).toBe('4');
  });

  it('keeps form values when adding an item fails', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(false);
    renderItemAdd(handleSubmit);

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    fireEvent.click(screen.getByRole('option', { name: 'white' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledOnce());
    expect(screen.getByLabelText('Item name')).toHaveValue('Leaf');
  });

  it('clears form values after an item is added successfully', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(true);
    renderItemAdd(handleSubmit);

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));
    fireEvent.click(screen.getByRole('option', { name: 'white' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Item name')).toHaveValue(''),
    );
  });

  it('does not offer colors already in the list, but offers them back when the list is cleared', () => {
    const { rerender } = render(
      <ItemAdd
        items={items}
        colors={colors}
        userItems={{
          wishlist: [
            {
              user_id: 1,
              item_id: 1,
              color: 4,
              name: 'Leaf',
              isInTrade: false,
            },
          ],
          tradelist: [],
        }}
        type={ListTypeEnum.Wishlist}
        isAdding={false}
        isCatalogLoading={false}
        handleSubmit={vi.fn()}
        clearError={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Color' }));

    expect(
      screen.queryByRole('option', { name: 'white' }),
    ).not.toBeInTheDocument();

    rerender(
      <ItemAdd
        items={items}
        colors={colors}
        userItems={{ wishlist: [], tradelist: [] }}
        type={ListTypeEnum.Wishlist}
        isAdding={false}
        isCatalogLoading={false}
        handleSubmit={vi.fn()}
        clearError={vi.fn()}
      />,
    );

    expect(screen.getByRole('option', { name: 'white' })).toBeInTheDocument();
  });
});
