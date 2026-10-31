import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Alert, { AlertProvider } from './Alert';

const renderActionAlert = (onClick: () => Promise<boolean>) =>
  render(
    <AlertProvider>
      <Alert
        message="Item removed"
        type="success"
        autoHide
        action={{ label: 'Undo', onClick }}
      />
    </AlertProvider>,
  );

describe('Alert action', () => {
  it('colors the spinner to match the success alert', async () => {
    let resolveAction: (success: boolean) => void = () => {};
    const onClick = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveAction = resolve;
        }),
    );
    renderActionAlert(onClick);

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(await screen.findByRole('status', { name: 'Loading' })).toHaveClass(
      'border-current',
      'border-t-transparent',
    );
    resolveAction(false);
  });

  it('closes the alert after its action succeeds', async () => {
    const onClick = vi.fn().mockResolvedValue(true);
    renderActionAlert(onClick);

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('keeps the alert open when its action fails', async () => {
    const onClick = vi.fn().mockResolvedValue(false);
    renderActionAlert(onClick);

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Item removed');
  });

  it('shows a fixed-size spinner while the action is pending', async () => {
    let resolveAction: (success: boolean) => void = () => {};
    const onClick = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveAction = resolve;
        }),
    );
    renderActionAlert(onClick);

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveStyle({
      width: '24px',
      height: '24px',
      flex: 'none',
    });
    resolveAction(false);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Undo' })).toHaveTextContent(
        'Undo',
      ),
    );
  });
});
