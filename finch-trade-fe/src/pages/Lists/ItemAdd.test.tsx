import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ItemAdd from './ItemAdd';
import { ListTypeEnum } from '../../shared/types';

const items = [
  { id: 1, name: 'Leaf' },
  { id: 2, name: 'Mushroom' },
];
const colors = [
  { id: 1, color: 'any' },
  { id: 4, color: 'white' },
];

const renderItemAdd = (handleSubmit = vi.fn()) =>
  render(
    <ItemAdd
      items={items}
      colors={colors}
      userItems={{ wishlist: [], tradelist: [] }}
      type={ListTypeEnum.Wishlist}
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

  it('submits the selected item and color through the form', () => {
    let submittedData: FormData | undefined;
    const handleSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
      submittedData = new FormData(event.currentTarget as HTMLFormElement);
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

  it('does not offer colors already in the list, but offers them back when the list is cleared', () => {
    const { rerender } = render(
      <ItemAdd
        items={items}
        colors={colors}
        userItems={{
          wishlist: [{ user_id: 1, item_id: 1, color: 4, name: 'Leaf' }],
          tradelist: [],
        }}
        type={ListTypeEnum.Wishlist}
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
        handleSubmit={vi.fn()}
        clearError={vi.fn()}
      />,
    );

    expect(screen.getByRole('option', { name: 'white' })).toBeInTheDocument();
  });
});
