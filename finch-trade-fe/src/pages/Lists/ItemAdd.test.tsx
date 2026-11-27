import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchItemColors } from '../../api/api';
import ItemAdd from './ItemAdd';
import { Color, ListTypeEnum, UserItems } from '../../shared/types';
import { MAX_ITEM_NAME_LENGTH } from '../../../../shared/src/constants/limits.js';

vi.mock('../../api/api', () => ({
  fetchItemColors: vi.fn(),
}));

const items = [
  { id: 1, name: 'Leaf' },
  { id: 2, name: 'Mushroom' },
];
const colors = [
  { id: 1, color: 'any' },
  { id: 2, color: 'black' },
  { id: 4, color: 'white' },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

const openColorOptions = async () => {
  const colorField = screen.getByRole('combobox', { name: 'Color' });
  await waitFor(() => expect(colorField).toBeEnabled());
  fireEvent.click(colorField);
};

const renderItemAdd = (
  handleSubmit = vi.fn().mockResolvedValue(true),
  isAdding = false,
) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ItemAdd
        items={items}
        colors={colors}
        userItems={{ wishlist: [], tradelist: [] }}
        type={ListTypeEnum.Wishlist}
        isAdding={isAdding}
        isCatalogLoading={false}
        handleSubmit={handleSubmit}
        clearError={vi.fn()}
      />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchItemColors).mockResolvedValue([
    { id: 1, color: 'any' },
    { id: 4, color: 'white' },
  ]);
});

describe('ItemAdd', () => {
  it('keeps the color label and disables the field while showing its loader', async () => {
    let resolveColors!: (colors: Color[]) => void;
    vi.mocked(fetchItemColors).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveColors = resolve;
        }),
    );
    renderItemAdd();

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));

    const colorField = await screen.findByRole('combobox', { name: 'Color' });
    expect(colorField).toBeDisabled();
    expect(
      within(colorField).getByRole('status', { name: 'Loading colors' }),
    ).toBeInTheDocument();
    expect(colorField.querySelector('svg')).not.toBeInTheDocument();

    resolveColors([{ id: 4, color: 'white' }]);
    await waitFor(() => expect(colorField).toBeEnabled());
    expect(
      within(colorField).queryByRole('status', { name: 'Loading colors' }),
    ).not.toBeInTheDocument();
  });

  it('fetches colors for a selected catalog item and reuses the cached result', async () => {
    renderItemAdd();

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    await openColorOptions();

    expect(await screen.findByRole('option', { name: 'white' })).toBeVisible();
    expect(fetchItemColors).toHaveBeenCalledWith(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));

    await openColorOptions();
    expect(await screen.findByRole('option', { name: 'white' })).toBeVisible();
    await waitFor(() => {
      expect(fetchItemColors).toHaveBeenCalledOnce();
    });
  });

  it('shows a retry action when item colors fail to load', async () => {
    vi.mocked(fetchItemColors)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([{ id: 4, color: 'white' }]);
    renderItemAdd();

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));

    const alert = await screen.findByRole('alert');
    const formCard = screen
      .getByLabelText('Item name')
      .closest('form')?.parentElement;
    expect(alert).toHaveTextContent('Could not load colors for this item.');
    expect(formCard).not.toContainElement(alert);
    expect(formCard?.parentElement).toContainElement(alert);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await openColorOptions();
    expect(await screen.findByRole('option', { name: 'white' })).toBeVisible();
  });

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

  it('only offers colors configured for the selected catalog item', async () => {
    vi.mocked(fetchItemColors).mockResolvedValue([
      { id: 1, color: 'any' },
      { id: 4, color: 'white' },
    ]);
    renderItemAdd();

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    await openColorOptions();

    expect(
      await screen.findByRole('option', { name: 'white' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'black' }),
    ).not.toBeInTheDocument();
  });

  it('enables confirmation after selecting an item and color', async () => {
    vi.mocked(fetchItemColors).mockResolvedValue([
      { id: 1, color: 'any' },
      { id: 4, color: 'white' },
    ]);
    renderItemAdd();
    const confirm = screen.getByRole('button', { name: 'Confirm' });

    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    await openColorOptions();
    fireEvent.click(await screen.findByRole('option', { name: 'white' }));

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

  it('submits the selected item and color through the form', async () => {
    vi.mocked(fetchItemColors).mockResolvedValue([
      { id: 1, color: 'any' },
      { id: 4, color: 'white' },
    ]);
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
    await openColorOptions();
    fireEvent.click(await screen.findByRole('option', { name: 'white' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(handleSubmit).toHaveBeenCalledOnce();
    expect(submittedData?.get('itemName')).toBe('Leaf');
    expect(submittedData?.get('itemColor')).toBe('4');
  });

  it('keeps form values when adding an item fails', async () => {
    vi.mocked(fetchItemColors).mockResolvedValue([
      { id: 1, color: 'any' },
      { id: 4, color: 'white' },
    ]);
    const handleSubmit = vi.fn().mockResolvedValue(false);
    renderItemAdd(handleSubmit);

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    await openColorOptions();
    fireEvent.click(await screen.findByRole('option', { name: 'white' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledOnce());
    expect(screen.getByLabelText('Item name')).toHaveValue('Leaf');
  });

  it('clears form values after an item is added successfully', async () => {
    vi.mocked(fetchItemColors).mockResolvedValue([
      { id: 1, color: 'any' },
      { id: 4, color: 'white' },
    ]);
    const handleSubmit = vi.fn().mockResolvedValue(true);
    renderItemAdd(handleSubmit);

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    await openColorOptions();
    fireEvent.click(await screen.findByRole('option', { name: 'white' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(screen.getByLabelText('Item name')).toHaveValue(''),
    );
  });

  it('does not offer colors already in the list, but offers them back when the list is cleared', async () => {
    const queryClient = createQueryClient();
    const renderForm = (userItems: UserItems) => (
      <QueryClientProvider client={queryClient}>
        <ItemAdd
          items={items}
          colors={colors}
          userItems={userItems}
          type={ListTypeEnum.Wishlist}
          isAdding={false}
          isCatalogLoading={false}
          handleSubmit={vi.fn()}
          clearError={vi.fn()}
        />
      </QueryClientProvider>
    );
    const userItems = {
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
    };
    const { rerender } = render(renderForm(userItems));

    fireEvent.change(screen.getByLabelText('Item name'), {
      target: { value: 'Leaf' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Leaf' }));
    await openColorOptions();

    expect(
      screen.queryByRole('option', { name: 'white' }),
    ).not.toBeInTheDocument();

    rerender(renderForm({ wishlist: [], tradelist: [] }));

    expect(
      await screen.findByRole('option', { name: 'white' }),
    ).toBeInTheDocument();
  });
});
