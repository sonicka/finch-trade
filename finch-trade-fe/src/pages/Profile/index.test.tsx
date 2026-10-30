import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Profile from './index';
import { editUser } from '../../api/api';

vi.mock('../../api/api', () => ({
  editUser: vi.fn(),
  fetchUser: vi.fn(),
}));

vi.mock('../../shared/context/UserProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../shared/context/UserProvider')
  >()),
  useUserData: () => ({
    user: {
      id: 7,
      username: 'Maya',
      birbName: 'Pip',
      friendCode: 'MAYA123',
      email: 'maya@example.com',
    },
  }),
}));

vi.mock('../../shared/components/Alert', () => ({
  default: ({ message }: { message: string }) => (
    <div role="alert">{message}</div>
  ),
}));

describe('Profile page', () => {
  const renderProfile = () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <Profile />
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(editUser).mockResolvedValue({ message: 'Profile updated' });
  });

  it('keeps save disabled until a valid change is made', () => {
    renderProfile();
    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toBeDisabled();
    expect(screen.getByLabelText('User Name')).toBeDisabled();
    expect(screen.getByLabelText('Birb Name')).toBeDisabled();
    expect(screen.getByLabelText('Friend Code')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'maya.new@example.com' },
    });
    expect(saveButton).toBeEnabled();
  });

  it('saves changed account details and displays success feedback', async () => {
    renderProfile();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'maya.new@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(editUser).toHaveBeenCalledWith(7, {
        email: 'maya.new@example.com',
        password: '',
        passwordAgain: '',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Profile updated',
    );
  });

  it('does not submit mismatched passwords', () => {
    renderProfile();

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('New password again'), {
      target: { value: 'different-password' },
    });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('displays API errors', async () => {
    vi.mocked(editUser).mockRejectedValue(new Error('Email already in use.'));
    renderProfile();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'taken@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already in use.',
    );
  });
});
